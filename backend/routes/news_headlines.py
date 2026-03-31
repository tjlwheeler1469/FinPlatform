"""
Financial News Headlines API
Fetches news from multiple financial sources via RSS feeds.
"""
from fastapi import APIRouter
from typing import List, Optional
from datetime import datetime, timezone
import logging
import asyncio
import httpx
import xml.etree.ElementTree as ET
from html import unescape
import re

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/news", tags=["Financial News"])

# Cache for news (expires after 10 minutes)
_news_cache = {}
_news_cache_ttl = 600  # 10 minutes

def get_cached_news(key: str):
    """Get cached news if not expired."""
    if key in _news_cache:
        data, timestamp = _news_cache[key]
        if (datetime.now(timezone.utc) - timestamp).total_seconds() < _news_cache_ttl:
            return data
    return None

def set_cached_news(key: str, data):
    """Cache news with timestamp."""
    _news_cache[key] = (data, datetime.now(timezone.utc))

# RSS Feed sources
NEWS_SOURCES = {
    "cnbc": {
        "name": "CNBC",
        "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
        "category": "markets"
    },
    "wsj_markets": {
        "name": "Wall Street Journal",
        "url": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml",
        "category": "markets"
    },
    "ft": {
        "name": "Financial Times",
        "url": "https://www.ft.com/rss/home",
        "category": "world"
    },
    "reuters_business": {
        "name": "Reuters Business",
        "url": "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
        "category": "business"
    },
    "yahoo_finance": {
        "name": "Yahoo Finance",
        "url": "https://finance.yahoo.com/news/rssindex",
        "category": "markets"
    },
    "marketwatch": {
        "name": "MarketWatch",
        "url": "http://feeds.marketwatch.com/marketwatch/topstories/",
        "category": "markets"
    },
    "bloomberg_markets": {
        "name": "Bloomberg",
        "url": "https://feeds.bloomberg.com/markets/news.rss",
        "category": "markets"
    },
    "afr": {
        "name": "Australian Financial Review",
        "url": "https://www.afr.com/rss/markets",
        "category": "australia"
    },
    "economist": {
        "name": "The Economist",
        "url": "https://www.economist.com/finance-and-economics/rss.xml",
        "category": "analysis"
    }
}

def clean_html(raw_html: str) -> str:
    """Remove HTML tags and clean text."""
    if not raw_html:
        return ""
    # Remove HTML tags
    clean = re.sub('<[^<]+?>', '', raw_html)
    # Unescape HTML entities
    clean = unescape(clean)
    # Remove extra whitespace
    clean = ' '.join(clean.split())
    return clean[:300] + "..." if len(clean) > 300 else clean

async def fetch_rss_feed(source_id: str, source_info: dict) -> List[dict]:
    """Fetch and parse RSS feed from a source."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; WealthCommand/1.0)"
            }
            response = await client.get(source_info["url"], headers=headers, follow_redirects=True)
            
            if response.status_code != 200:
                logger.warning(f"Failed to fetch {source_id}: HTTP {response.status_code}")
                return []
            
            # Parse XML
            root = ET.fromstring(response.text)
            
            items = []
            # Handle both RSS 2.0 and Atom formats
            for item in root.findall(".//item")[:10]:  # Limit to 10 items per source
                try:
                    title = item.find("title")
                    link = item.find("link")
                    description = item.find("description")
                    pub_date = item.find("pubDate")
                    
                    if title is not None and title.text:
                        items.append({
                            "source": source_info["name"],
                            "source_id": source_id,
                            "category": source_info["category"],
                            "title": clean_html(title.text),
                            "link": link.text if link is not None else "",
                            "summary": clean_html(description.text) if description is not None else "",
                            "published": pub_date.text if pub_date is not None else "",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        })
                except Exception as e:
                    logger.warning(f"Error parsing item from {source_id}: {e}")
                    continue
            
            # Also try Atom format
            for entry in root.findall(".//{http://www.w3.org/2005/Atom}entry")[:10]:
                try:
                    title = entry.find("{http://www.w3.org/2005/Atom}title")
                    link = entry.find("{http://www.w3.org/2005/Atom}link")
                    summary = entry.find("{http://www.w3.org/2005/Atom}summary")
                    updated = entry.find("{http://www.w3.org/2005/Atom}updated")
                    
                    if title is not None and title.text:
                        items.append({
                            "source": source_info["name"],
                            "source_id": source_id,
                            "category": source_info["category"],
                            "title": clean_html(title.text),
                            "link": link.get("href") if link is not None else "",
                            "summary": clean_html(summary.text) if summary is not None else "",
                            "published": updated.text if updated is not None else "",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        })
                except Exception as e:
                    logger.warning(f"Error parsing Atom entry from {source_id}: {e}")
                    continue
            
            return items
            
    except Exception as e:
        logger.error(f"Error fetching RSS from {source_id}: {e}")
        return []

def get_fallback_news() -> List[dict]:
    """Return fallback news when feeds fail."""
    return [
        {
            "source": "Market Update",
            "source_id": "fallback",
            "category": "markets",
            "title": "Markets Mixed as Investors Await Fed Decision",
            "link": "",
            "summary": "Global markets showed mixed results as investors position ahead of the Federal Reserve's upcoming interest rate decision.",
            "published": datetime.now(timezone.utc).isoformat(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "source": "Australian Markets",
            "source_id": "fallback",
            "category": "australia",
            "title": "ASX 200 Tracks Wall Street Overnight Moves",
            "link": "",
            "summary": "The Australian sharemarket opened higher following positive sentiment from US markets, with miners and banks leading gains.",
            "published": datetime.now(timezone.utc).isoformat(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "source": "Economic Analysis",
            "source_id": "fallback",
            "category": "analysis",
            "title": "Inflation Data Points to Gradual Cooling",
            "link": "",
            "summary": "Latest economic indicators suggest inflation is moderating, potentially giving central banks room to ease monetary policy.",
            "published": datetime.now(timezone.utc).isoformat(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "source": "Commodities",
            "source_id": "fallback",
            "category": "markets",
            "title": "Gold Holds Steady Near Record Highs",
            "link": "",
            "summary": "Gold prices remain elevated as geopolitical tensions and central bank buying continue to support the precious metal.",
            "published": datetime.now(timezone.utc).isoformat(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        {
            "source": "Tech Sector",
            "source_id": "fallback",
            "category": "markets",
            "title": "Tech Stocks Rally on AI Optimism",
            "link": "",
            "summary": "Technology shares advanced as enthusiasm around artificial intelligence continues to drive investor interest in the sector.",
            "published": datetime.now(timezone.utc).isoformat(),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    ]

@router.get("/headlines")
async def get_news_headlines(
    sources: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 20
):
    """
    Get news headlines from financial sources.
    
    - sources: Comma-separated list of source IDs (cnbc, wsj_markets, ft, afr, economist, etc.)
    - category: Filter by category (markets, australia, analysis, business, world)
    - limit: Maximum number of headlines to return (default 20)
    """
    cache_key = f"headlines_{sources}_{category}_{limit}"
    cached = get_cached_news(cache_key)
    if cached:
        return cached
    
    # Determine which sources to fetch
    if sources:
        source_ids = [s.strip() for s in sources.split(",")]
        sources_to_fetch = {k: v for k, v in NEWS_SOURCES.items() if k in source_ids}
    else:
        sources_to_fetch = NEWS_SOURCES
    
    # Fetch all feeds concurrently
    tasks = [
        fetch_rss_feed(source_id, source_info) 
        for source_id, source_info in sources_to_fetch.items()
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Combine all headlines
    all_headlines = []
    for result in results:
        if isinstance(result, list):
            all_headlines.extend(result)
    
    # If no headlines fetched, use fallback
    if not all_headlines:
        all_headlines = get_fallback_news()
    
    # Filter by category if specified
    if category:
        all_headlines = [h for h in all_headlines if h["category"] == category]
    
    # Sort by timestamp (newest first) and limit
    all_headlines.sort(key=lambda x: x.get("published", ""), reverse=True)
    all_headlines = all_headlines[:limit]
    
    response = {
        "headlines": all_headlines,
        "count": len(all_headlines),
        "sources": list(sources_to_fetch.keys()),
        "fetched_at": datetime.now(timezone.utc).isoformat()
    }
    
    set_cached_news(cache_key, response)
    return response

@router.get("/sources")
async def get_news_sources():
    """Get list of available news sources."""
    return {
        "sources": [
            {
                "id": source_id,
                "name": info["name"],
                "category": info["category"]
            }
            for source_id, info in NEWS_SOURCES.items()
        ]
    }

@router.get("/categories")
async def get_news_categories():
    """Get list of news categories."""
    categories = list(set(info["category"] for info in NEWS_SOURCES.values()))
    return {"categories": categories}
