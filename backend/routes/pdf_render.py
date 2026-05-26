"""
Server-side PDF rendering using the system `chromium --headless` binary.

This produces typeset-quality PDFs (real fonts, no canvas rasterisation) that
look like a printed letter. Used by the SOA/ROA Builder when the adviser wants
the production-grade PDF rather than the client-side jsPDF fallback.

The endpoint accepts HTML, renders it via `chromium --headless --print-to-pdf`
into a temp file, then automatically persists the result to the local object
storage with full versioning.

Endpoints (under /api/render):
  POST /pdf-from-html         render HTML → PDF → persist to /api/files
  GET  /capabilities          probe for chromium availability
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
import asyncio
import shutil
import tempfile
import logging

from routes.local_files import _persist

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/render", tags=["PDF Rendering"])

CHROMIUM = shutil.which("chromium") or shutil.which("chromium-browser") or shutil.which("google-chrome")
RENDER_TIMEOUT = 30  # seconds


class PdfFromHtmlPayload(BaseModel):
    html: str
    filename: str = "document.pdf"
    owner_client_id: Optional[str] = None
    tags: Optional[List[str]] = None
    source_deal_id: Optional[str] = None
    source_pack_id: Optional[str] = None
    family_key: Optional[str] = None
    paper_size: str = "A4"  # A4 | Letter
    margin_mm: int = 12


@router.get("/capabilities")
async def capabilities() -> dict:
    """Tell the frontend whether server-side PDF rendering is available so it
    can offer the "Render as letter-quality PDF" button only when supported."""
    return {
        "chromium_available": bool(CHROMIUM),
        "chromium_path": CHROMIUM,
        "supports_html_to_pdf": bool(CHROMIUM),
        "render_timeout_seconds": RENDER_TIMEOUT,
    }


async def _run_chromium(html_path: Path, pdf_path: Path, paper: str, margin_mm: int) -> None:
    """Spawn chromium in headless mode and convert html_path → pdf_path."""
    if not CHROMIUM:
        raise HTTPException(503, "Chromium not available on this host")
    margin_in = margin_mm / 25.4  # noqa: F841 reserved for fine-grained margin override
    cmd = [
        CHROMIUM,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        f"--default-pdf-paper-size={paper}",
        "--print-to-pdf-no-header",
        f"file://{html_path}",
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    try:
        _stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=RENDER_TIMEOUT)
    except asyncio.TimeoutError:
        proc.kill()
        await proc.wait()
        raise HTTPException(504, f"PDF render timed out after {RENDER_TIMEOUT}s")
    if proc.returncode != 0:
        logger.error("chromium exit %s: %s", proc.returncode, stderr[:500])
        raise HTTPException(500, f"chromium exit {proc.returncode}: {stderr.decode('utf-8', 'ignore')[:300]}")


@router.post("/pdf-from-html")
async def pdf_from_html(payload: PdfFromHtmlPayload) -> dict:
    """Render a snippet of HTML to PDF and persist to the Vault. Returns the
    new object_id + version so the caller can show "Downloaded · v2 LATEST"."""
    if not CHROMIUM:
        raise HTTPException(503, "chromium not installed — server-side PDF rendering unavailable")
    # Wrap the HTML with a minimal styled shell so adviser-supplied HTML always
    # renders with consistent margins / fonts.
    full_html = f"""<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page {{ size: {payload.paper_size}; margin: {payload.margin_mm}mm; }}
  body {{ font-family: Georgia, 'Times New Roman', serif; color: #1a2744; line-height: 1.5; }}
  h1, h2, h3 {{ color: #1a2744; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th, td {{ padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }}
</style></head><body>{payload.html}</body></html>
"""
    content = await _render_pdf_bytes(full_html, paper_size=payload.paper_size, margin_mm=payload.margin_mm)

    # Persist to the Vault (handles versioning automatically when family_key is supplied)
    meta = await _persist(
        content,
        filename=payload.filename,
        mime="application/pdf",
        owner_client_id=payload.owner_client_id,
        tags=(payload.tags or []) + ["server-rendered"],
        source_deal_id=payload.source_deal_id,
        source_pack_id=payload.source_pack_id,
        family_key=payload.family_key,
    )
    return {
        "success": True,
        "object_id": meta["object_id"],
        "version": meta["version"],
        "size_bytes": meta["size_bytes"],
        "download_url": f"/api/files/{meta['object_id']}",
        "renderer": "chromium-headless",
    }


async def _render_pdf_bytes(html: str, paper_size: str = "A4", margin_mm: int = 12) -> bytes:
    """Reusable helper: render arbitrary HTML to PDF bytes via headless Chromium.

    Other routes (e.g. /api/evidence/generate) call this to avoid duplicating the
    chromium subprocess plumbing.
    """
    if not CHROMIUM:
        raise HTTPException(503, "chromium not installed — server-side PDF rendering unavailable")
    with tempfile.TemporaryDirectory() as tmpdir:
        html_path = Path(tmpdir) / "in.html"
        pdf_path = Path(tmpdir) / "out.pdf"
        html_path.write_text(html, encoding="utf-8")
        await _run_chromium(html_path, pdf_path, paper_size, margin_mm)
        if not pdf_path.exists():
            raise HTTPException(500, "chromium ran but produced no PDF")
        return pdf_path.read_bytes()
