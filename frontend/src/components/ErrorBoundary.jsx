import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", this.props.label || "Unknown", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
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
            This section encountered an error. Click retry to reload it.
          </p>
          <Button variant="outline" size="sm" onClick={this.handleRetry} data-testid="error-boundary-retry">
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
