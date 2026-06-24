import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <span className="text-2xl font-black text-red-400">!</span>
            </div>
            <h1 className="mb-2 text-2xl font-black text-white font-heading">Something went wrong</h1>
            <p className="mb-6 text-sm text-gray-500">{this.state.error.message}</p>
            <button onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
