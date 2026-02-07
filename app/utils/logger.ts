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

const normalizeDetails = (details: unknown) => {
  if (details instanceof Error) {
    return {
      name: details.name,
      message: details.message,
      stack: details.stack,
    };
  }
  if (details === undefined) return undefined;
  try {
    return JSON.parse(
      JSON.stringify(details, (_, value) => {
        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack,
          };
        }
        return value;
      })
    );
  } catch {
    return { note: "unserializable_details" };
  }
};

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

  const normalizedDetails = normalizeDetails(details);
  const payload: LogPayload = {
    level,
    scope,
    message,
    details: normalizedDetails,
    timestamp: new Date().toISOString(),
  };

  // Use warn for app-level errors to avoid Next.js dev overlay for expected runtime failures.
  const fn = level === "error" ? console.warn : level === "warn" ? console.warn : console.log;
  fn(`[${payload.timestamp}] [${level.toUpperCase()}] [${scope}] ${message}`, normalizedDetails ?? "");
  void sendToServer(payload);
};

export const logger = {
  debug: (scope: string, message: string, details?: unknown) => write("debug", scope, message, details),
  info: (scope: string, message: string, details?: unknown) => write("info", scope, message, details),
  warn: (scope: string, message: string, details?: unknown) => write("warn", scope, message, details),
  error: (scope: string, message: string, details?: unknown) => write("error", scope, message, details),
};
