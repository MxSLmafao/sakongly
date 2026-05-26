import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Sakongly] Uncaught error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleCopy = () => {
    const text = `${this.state.error?.name}: ${this.state.error?.message}\n${this.state.error?.stack}`;
    navigator.clipboard.writeText(text).catch(() => {});
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 p-6 bg-background text-foreground">
          <p className="text-destructive font-medium">Something went wrong</p>
          <pre className="text-xs max-w-lg overflow-auto bg-muted p-3 rounded text-muted-foreground">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={this.handleReload}
              className="px-3 py-1.5 rounded bg-primary text-primary-foreground text-sm"
            >
              Reload
            </button>
            <button
              onClick={this.handleCopy}
              className="px-3 py-1.5 rounded bg-muted text-muted-foreground text-sm"
            >
              Copy error
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
