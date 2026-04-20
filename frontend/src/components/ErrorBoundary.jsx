import { Component } from "react";
import { AlertTriangle, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

// Hard refresh: clears browser caches, unregisters service workers, then reloads bypassing cache
export const hardRefresh = async () => {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    // continue to reload regardless
  }
  // Append a cache-busting param to force a fully fresh fetch
  const url = new URL(window.location.href);
  url.searchParams.set("_cb", Date.now().toString());
  window.location.replace(url.toString());
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0, isChunkError: false };
  }

  static getDerivedStateFromError(error) {
    const isChunkError = error?.message?.includes("Unexpected token") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Loading CSS chunk") ||
      error?.name === "ChunkLoadError";
    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    // Ignore browser extension errors
    if (error?.stack?.includes("chrome-extension") || error?.stack?.includes("moz-extension")) {
      this.setState({ hasError: false, error: null });
      return;
    }
    // Auto-retry chunk errors up to twice; on the third, surface the hard-refresh UI
    if (this.state.isChunkError && this.state.retryCount < 2) {
      this.setState((prev) => ({ retryCount: prev.retryCount + 1, hasError: false, error: null }));
      return;
    }
    console.error("[ErrorBoundary]", this.props.label || "Unknown", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, retryCount: 0 });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="error-boundary-fallback">
          <AlertTriangle className="h-10 w-10 text-orange-500 mb-3" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            {this.props.label ? `${this.props.label} failed to load` : "Something went wrong"}
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-md text-center">
            {this.state.isChunkError
              ? "A new version is available or a cached file is stale. Use Hard Refresh to clear the cache and reload."
              : "This section encountered an error. Click retry to reload it."}
          </p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button variant="outline" size="sm" onClick={this.handleRetry} data-testid="error-boundary-retry">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Retry
            </Button>
            <Button variant="outline" size="sm" onClick={this.handleReload} data-testid="error-boundary-reload">
              Reload Page
            </Button>
            <Button size="sm" onClick={hardRefresh} className="bg-[#1a2744]" data-testid="error-boundary-hard-refresh">
              <Zap className="h-3.5 w-3.5 mr-2" />
              Hard Refresh
            </Button>
          </div>
          {this.state.isChunkError && (
            <p className="text-[10px] text-muted-foreground mt-3 max-w-md text-center">
              Tip: Hard Refresh clears your browser cache for this app and forces the latest version to load.
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
