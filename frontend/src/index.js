import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress benign errors: Chrome extensions + webpack chunk-load failures
const SUPPRESS_PATTERNS = [
  "chrome-extension", "moz-extension", "frame_ant",
  "Unexpected token", "Loading chunk", "ChunkLoadError",
  "Response body is already used"
];

const shouldSuppress = (str) => SUPPRESS_PATTERNS.some(p => str?.includes(p));

// Filter cosmetic Recharts ResponsiveContainer measurement warnings that fire transiently
// during first-paint inside lazy / sticky / tab-hidden chart parents.
// Recharts emits these via console.warn; the chart itself renders fine within ~200ms.
const _origConsoleWarn = console.warn;
console.warn = (...args) => {
  const first = args[0];
  if (typeof first === "string" && first.includes("width(-1) and height(-1) of chart")) {
    return;
  }
  _origConsoleWarn.apply(console, args);
};

window.addEventListener("error", (e) => {
  if (shouldSuppress(e.filename) || shouldSuppress(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

window.addEventListener("unhandledrejection", (e) => {
  const msg = e.reason?.message || "";
  const stack = e.reason?.stack || "";
  if (shouldSuppress(msg) || shouldSuppress(stack)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

// Remove CRA / webpack-dev-server error overlay when it shows benign errors
if (typeof window !== "undefined") {
  const removeOverlayIfBenign = () => {
    // CRA injects an iframe overlay for runtime errors
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        const style = iframe.getAttribute('style') || '';
        if (style.includes('position: fixed') || style.includes('position:fixed')) {
          const body = iframe.contentDocument?.body;
          const text = body?.textContent || body?.innerText || '';
          if (shouldSuppress(text)) {
            iframe.remove();
          }
        }
      } catch { /* cross-origin iframe — ignore */ }
    });
    // Also remove the webpack-dev-server overlay div
    const wdsOverlay = document.getElementById('webpack-dev-server-client-overlay');
    if (wdsOverlay) {
      const text = wdsOverlay.textContent || wdsOverlay.shadowRoot?.textContent || '';
      if (shouldSuppress(text)) wdsOverlay.remove();
    }
  };

  const obs = new MutationObserver(() => {
    setTimeout(removeOverlayIfBenign, 150);
  });
  // Start observing once body exists
  if (document.body) {
    obs.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () =>
      obs.observe(document.body, { childList: true, subtree: true })
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
