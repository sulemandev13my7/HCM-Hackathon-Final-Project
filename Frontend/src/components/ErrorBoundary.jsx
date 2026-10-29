import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-hcm-canvas p-4">
          <div className="w-full max-w-md rounded-2xl border border-hcm-line bg-hcm-surface p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-hcm-ink">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-hcm-muted">
              The page hit an unexpected error. Reload to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-hcm-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-hcm-accent-strong"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
