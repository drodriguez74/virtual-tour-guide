"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 bg-stone-900 p-6 text-center">
            <p className="text-lg font-semibold text-white">
              Something went wrong
            </p>
            <p className="text-sm text-stone-400">
              Try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white"
            >
              Refresh
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
