import { useState, useEffect, useRef } from "react";
import { 
  Terminal, X, Trash2, Copy, CheckCircle2, 
  ChevronDown, ChevronUp, Activity
} from "lucide-react";
import { logger, type LogEntry, type LogLevel } from "../services/logger";
import { api } from "../services/api";

export function LiveLogsDrawer() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"ALL" | LogLevel | "SYSTEM">("ALL");
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [testingHealth, setTestingHealth] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filter === "ALL") return true;
    if (filter === "SYSTEM") return log.category === "System" || log.category === "ErrorBoundary";
    return log.level === filter;
  });

  const errorCount = logs.filter((l) => l.level === "ERROR").length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;
  const networkCount = logs.filter((l) => l.level === "NETWORK").length;

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.category}] ${l.message} ${l.details ? JSON.stringify(l.details) : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestHealth = async () => {
    setTestingHealth(true);
    logger.info("Diagnostics", "Manual network probe initiated to /api/health...");
    try {
      const res = await api.getHealth();
      logger.success("Diagnostics", "Health probe response received successfully", res);
    } catch (err: any) {
      logger.error("Diagnostics", "Health probe failed", { error: err.message || err });
    } finally {
      setTestingHealth(false);
    }
  };

  const getBadgeStyle = (level: LogLevel) => {
    switch (level) {
      case "ERROR":
        return "bg-rose-500/20 text-rose-300 border-rose-500/40";
      case "WARN":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "NETWORK":
        return "bg-sky-500/20 text-sky-300 border-sky-500/40";
      case "VALUATION":
        return "bg-gold/20 text-gold-light border-gold/40";
      case "SUCCESS":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-zinc-800 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <>
      {/* Floating Telemetry Trigger Badge at Bottom-Right */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full font-mono text-xs font-bold transition shadow-2xl backdrop-blur-md border ${
            errorCount > 0
              ? "bg-rose-950/90 text-rose-300 border-rose-500 hover:bg-rose-900"
              : "bg-card/90 text-white border-gold/40 hover:border-gold hover:bg-card"
          }`}
          title="Click to toggle live diagnostic telemetry log drawer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                errorCount > 0 ? "bg-rose-400" : "bg-emerald-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                errorCount > 0 ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
          </span>
          <Terminal className="h-3.5 w-3.5 text-gold" />
          <span>Telemetry ({logs.length})</span>
          {errorCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {errorCount} err
            </span>
          )}
          {isOpen ? <ChevronDown className="h-3 w-3 opacity-60" /> : <ChevronUp className="h-3 w-3 opacity-60" />}
        </button>
      </div>

      {/* Expanded Telemetry Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 right-2 sm:right-4 left-2 sm:left-auto sm:w-[620px] max-h-[500px] z-50 rounded-2xl border border-gold/40 bg-zinc-950/95 backdrop-blur-xl shadow-2xl flex flex-col text-white font-sans overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/80 flex items-center justify-between bg-card/80">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-gold" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Live System Diagnostics
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-mutedText font-mono">
                  <span>{logs.length} events logged</span>
                  {networkCount > 0 && <span>• {networkCount} API calls</span>}
                  {errorCount > 0 && (
                    <span className="text-rose-400 font-bold">• {errorCount} errors</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleTestHealth}
                disabled={testingHealth}
                className="px-2 py-1 rounded bg-background hover:bg-zinc-800 border border-border text-[11px] font-semibold text-gold flex items-center gap-1 transition disabled:opacity-50"
                title="Send test ping to backend"
              >
                <Activity className="h-3 w-3" />
                {testingHealth ? "Pinging..." : "Ping API"}
              </button>

              <button
                onClick={handleCopyLogs}
                className="p-1.5 rounded hover:bg-zinc-800 text-mutedText hover:text-white transition"
                title="Copy all logs to clipboard"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={() => logger.clear()}
                className="p-1.5 rounded hover:bg-zinc-800 text-mutedText hover:text-white transition"
                title="Clear logs"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded hover:bg-zinc-800 text-mutedText hover:text-white transition"
                title="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-2 border-b border-border/60 bg-background/50 flex items-center gap-1 text-[11px] overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-mutedText mr-1">Filter:</span>
            {(["ALL", "NETWORK", "VALUATION", "ERROR", "WARN", "INFO"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition ${
                  filter === f
                    ? "bg-gold text-black"
                    : "text-mutedText hover:text-white hover:bg-zinc-800"
                }`}
              >
                {f}
                {f === "ERROR" && errorCount > 0 && ` (${errorCount})`}
                {f === "WARN" && warnCount > 0 && ` (${warnCount})`}
              </button>
            ))}
          </div>

          {/* Log Stream Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[360px] font-mono text-xs">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-mutedText text-xs">
                No logs match the selected filter.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const hasDetails = log.details !== undefined && log.details !== null;

                return (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-zinc-900/80 border border-border/50 hover:border-border transition space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-mutedText">{log.timestamp}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${getBadgeStyle(
                            log.level
                          )}`}
                        >
                          {log.level}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded">
                          {log.category}
                        </span>
                      </div>

                      {hasDetails && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-[10px] text-gold hover:underline flex items-center gap-0.5"
                        >
                          {isExpanded ? "Hide Details" : "View Details"}
                        </button>
                      )}
                    </div>

                    <p className={`text-xs break-words leading-relaxed ${
                      log.level === "ERROR"
                        ? "text-rose-300 font-semibold"
                        : log.level === "WARN"
                        ? "text-amber-200"
                        : log.level === "NETWORK"
                        ? "text-sky-200"
                        : log.level === "VALUATION"
                        ? "text-gold-light"
                        : "text-zinc-200"
                    }`}>
                      {log.message}
                    </p>

                    {/* Expandable JSON details */}
                    {isExpanded && hasDetails && (
                      <div className="mt-1.5 p-2 rounded bg-black/80 border border-border text-[11px] text-zinc-400 overflow-x-auto max-h-40">
                        <pre className="whitespace-pre-wrap">
                          {typeof log.details === "object"
                            ? JSON.stringify(log.details, null, 2)
                            : String(log.details)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </>
  );
}
