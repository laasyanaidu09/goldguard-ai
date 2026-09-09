import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RefreshCw, Terminal, CheckCircle2 } from "lucide-react";
import { logger } from "../services/logger";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error("ErrorBoundary", `Uncaught render crash: ${error.message}`, {
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private copyDiagnostics = () => {
    const text = `GoldGuard Render Exception:\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}\nComponent Stack: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="my-8 mx-auto max-w-3xl rounded-2xl border border-rose-500/40 bg-card/95 p-6 sm:p-8 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
              <AlertOctagon className="h-7 w-7" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {this.props.fallbackTitle || "Portfolio Interface Recovery Mode"}
                </h3>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Render Glitch Prevented
                </span>
              </div>
              <p className="text-xs sm:text-sm text-mutedText">
                An unhandled rendering exception occurred while computing your jewellery portfolio. Technical telemetry has been captured to prevent a blank white screen.
              </p>

              {/* Technical Error Box */}
              <div className="mt-4 rounded-xl border border-border bg-background/90 p-3.5 font-mono text-xs text-rose-300 overflow-x-auto space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-gold" />
                  <span>{this.state.error?.name || "Error"}: {this.state.error?.message || "Unknown error"}</span>
                </div>
                {this.state.error?.stack && (
                  <pre className="text-[11px] text-mutedText/80 whitespace-pre-wrap mt-2 max-h-36 overflow-y-auto">
                    {this.state.error.stack.split("\n").slice(0, 4).join("\n")}
                  </pre>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={this.handleReset}
                  className="px-4 py-2 rounded-lg bg-gold hover:bg-gold-light text-black font-bold text-xs flex items-center gap-1.5 transition shadow-md shadow-gold/20"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try Recovering View
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 rounded-lg bg-background hover:bg-card border border-border text-white font-semibold text-xs transition"
                >
                  Reload Page
                </button>
                <button
                  onClick={this.copyDiagnostics}
                  className="px-3 py-2 rounded-lg bg-background/60 hover:bg-background border border-border/80 text-mutedText hover:text-white text-xs transition ml-auto flex items-center gap-1"
                >
                  {this.state.copied ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copied Trace</span>
                    </>
                  ) : (
                    "Copy Diagnostics"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
