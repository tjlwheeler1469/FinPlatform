import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a chunk loading error — auto-retry by reloading the page
    const isChunkError = error?.message?.includes("Unexpected token") ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Loading CSS chunk") ||
      error?.name === "ChunkLoadError";

    return { hasError: true, error, isChunkError };
  }

  componentDidCatch(error, errorInfo) {
    // Ignore Chrome extension errors
    if (error?.stack?.includes("chrome-extension") || error?.stack?.includes("moz-extension")) {
      this.setState({ hasError: false, error: null });
      return;
    }

    // Auto-retry chunk loading errors (up to 2 times)
    if (this.state.isChunkError && this.state.retryCount < 2) {
      this.setState(prev => ({ retryCount: prev.retryCount + 1, hasError: false, error: null }));
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
              ? "A new version is available. Please reload to get the latest." 
              : "This section encountered an error. Click retry to reload it."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={this.handleRetry} data-testid="error-boundary-retry">
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Retry
            </Button>
            {this.state.isChunkError && (
              <Button variant="default" size="sm" onClick={this.handleReload} className="bg-[#1a2744]">
                Reload Page
              </Button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
