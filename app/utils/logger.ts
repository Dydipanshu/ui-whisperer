type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = {
  level: LogLevel;
  scope: string;
  message: string;
  details?: unknown;
  timestamp: string;
};

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

const getMinLevel = (): LogLevel => {
  const configured = (process.env.NEXT_PUBLIC_LOG_LEVEL ?? "debug").toLowerCase() as LogLevel;
  return LEVELS.includes(configured) ? configured : "debug";
};

const canLog = (level: LogLevel) => LEVELS.indexOf(level) >= LEVELS.indexOf(getMinLevel());

const sendToServer = async (payload: LogPayload) => {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore logger transport failures.
  }
};

const write = (level: LogLevel, scope: string, message: string, details?: unknown) => {
  if (!canLog(level)) return;

  const payload: LogPayload = {
    level,
    scope,
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  fn(`[${payload.timestamp}] [${level.toUpperCase()}] [${scope}] ${message}`, details ?? "");
  void sendToServer(payload);
};

export const logger = {
  debug: (scope: string, message: string, details?: unknown) => write("debug", scope, message, details),
  info: (scope: string, message: string, details?: unknown) => write("info", scope, message, details),
  warn: (scope: string, message: string, details?: unknown) => write("warn", scope, message, details),
  error: (scope: string, message: string, details?: unknown) => write("error", scope, message, details),
};
