export type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR" | "NETWORK" | "VALUATION";

export interface LogEntry {
  id: string;
  timestamp: string; // HH:mm:ss.SSS
  rawTime: number;
  level: LogLevel;
  category: string;
  message: string;
  details?: any;
}

type LogListener = (logs: LogEntry[]) => void;

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 300;

  constructor() {
    // Initial startup log
    this.addLog("INFO", "System", "GoldGuard Telemetry Engine initialized.");
  }

  private addLog(level: LogLevel, category: string, message: string, details?: any) {
    const now = new Date();
    const pad = (n: number, z = 2) => String(n).padStart(z, "0");
    const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      rawTime: now.getTime(),
      level,
      category,
      message,
      details
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Mirror to standard browser console with distinct styling
    const prefix = `[GoldGuard:${category}]`;
    if (level === "ERROR") {
      console.error(prefix, message, details || "");
    } else if (level === "WARN") {
      console.warn(prefix, message, details || "");
    } else if (level === "NETWORK") {
      console.info(`%c${prefix} ${message}`, "color: #38bdf8; font-weight: bold;", details || "");
    } else if (level === "VALUATION") {
      console.info(`%c${prefix} ${message}`, "color: #facc15; font-weight: bold;", details || "");
    } else if (level === "SUCCESS") {
      console.info(`%c${prefix} ${message}`, "color: #4ade80; font-weight: bold;", details || "");
    } else {
      console.log(prefix, message, details || "");
    }

    this.notify();
  }

  public info(category: string, message: string, details?: any) {
    this.addLog("INFO", category, message, details);
  }

  public success(category: string, message: string, details?: any) {
    this.addLog("SUCCESS", category, message, details);
  }

  public warn(category: string, message: string, details?: any) {
    this.addLog("WARN", category, message, details);
  }

  public error(category: string, message: string, details?: any) {
    this.addLog("ERROR", category, message, details);
  }

  public network(method: string, endpoint: string, status: number | string, latencyMs?: number, details?: any) {
    const latencyStr = latencyMs !== undefined ? ` (${latencyMs}ms)` : "";
    const isSuccess = typeof status === "number" && status >= 200 && status < 300;
    const level: LogLevel = isSuccess ? "NETWORK" : "ERROR";
    const msg = `${method} ${endpoint} → ${status}${latencyStr}`;
    this.addLog(level, "API", msg, details);
  }

  public valuation(category: string, message: string, details?: any) {
    this.addLog("VALUATION", category, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
    this.info("System", "Log history cleared by user.");
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error("Logger subscriber error:", err);
      }
    });
  }
}

export const logger = new LoggerService();

// Expose globally for browser console diagnostics
if (typeof window !== "undefined") {
  (window as any).__GOLDGUARD_LOGGER__ = logger;
}
