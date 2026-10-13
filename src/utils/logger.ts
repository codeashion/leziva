/**
 * Structured Application Logger for LEZIVA
 * Formats log entries with ISO timestamps, log levels, and contextual metadata.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: string, metadata?: Record<string, unknown>): LogPayload {
    return {
      level,
      message,
      context,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }

  debug(message: string, metadata?: Record<string, unknown>, context?: string) {
    if (process.env.NODE_ENV !== "production") {
      const payload = this.formatLog("debug", message, context, metadata);
      console.debug(`[DEBUG] [${payload.timestamp}] [${context || "App"}] ${message}`, metadata || "");
    }
  }

  info(message: string, metadata?: Record<string, unknown>, context?: string) {
    const payload = this.formatLog("info", message, context, metadata);
    console.info(`[INFO] [${payload.timestamp}] [${context || "App"}] ${message}`, metadata || "");
  }

  warn(message: string, metadata?: Record<string, unknown>, context?: string) {
    const payload = this.formatLog("warn", message, context, metadata);
    console.warn(`[WARN] [${payload.timestamp}] [${context || "App"}] ${message}`, metadata || "");
  }

  error(message: string, error?: unknown, context?: string) {
    const metadata = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { raw: error };
    const payload = this.formatLog("error", message, context, metadata);
    console.error(`[ERROR] [${payload.timestamp}] [${context || "App"}] ${message}`, metadata);
  }
}

export const logger = new Logger();
