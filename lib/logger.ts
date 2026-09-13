import { getEnv } from "@/lib/env";

type LogLevel = "debug" | "info" | "warn" | "error";

const rank: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const secretKeys = [
  "key",
  "token",
  "secret",
  "password",
  "authorization",
  "private",
];

function shouldLog(level: LogLevel): boolean {
  try {
    return rank[level] >= rank[getEnv().LOG_LEVEL];
  } catch {
    return true;
  }
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => {
        if (secretKeys.some((part) => key.toLowerCase().includes(part))) {
          return [key, "[redacted]"];
        }
        return [key, redact(nested)];
      }),
    );
  }
  return value;
}

function write(level: LogLevel, message: string, extra?: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const line = {
    level,
    time: new Date().toISOString(),
    message,
    ...(extra ? { extra: redact(extra) } : {}),
  };

  const serialized = JSON.stringify(line);
  if (level === "error") {
    console.error(serialized);
    return;
  }
  if (level === "warn") {
    console.warn(serialized);
    return;
  }
  console.log(serialized);
}

export const logger = {
  debug: (message: string, extra?: Record<string, unknown>) =>
    write("debug", message, extra),
  info: (message: string, extra?: Record<string, unknown>) =>
    write("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) =>
    write("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) =>
    write("error", message, extra),
};
