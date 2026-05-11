import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  /** Where the "Back" button should send the user. */
  fallbackPath: string;
  /** Label for the back button. */
  fallbackLabel?: string;
  /** Optional title shown above the error description. */
  title?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time errors inside a route so the user is never stranded on a
 * blank white screen. Always renders a working "back" button (uses a real
 * anchor so it works even if React Router state is corrupted).
 */
export default class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[RouteErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallbackPath, fallbackLabel = "Back to Dashboard", title = "Something went wrong" } = this.props;

    return (
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-sm text-muted-foreground">
                We hit an unexpected error loading this page. You can head back and try again — your data is safe.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-muted-foreground/80 font-mono break-all">
                  {this.state.error.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Real anchor — works even if router context is broken */}
            <Button asChild variant="default">
              <a href={fallbackPath} onClick={this.handleReset}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {fallbackLabel}
              </a>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      </div>
    );
  }
}