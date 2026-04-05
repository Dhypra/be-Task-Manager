/**
 * Logger Utility
 * Structured logging for production use
 */

enum LogLevel {
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

const log = (
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): void => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(data && { data }),
  };

  if (level === LogLevel.ERROR) {
    console.error(JSON.stringify(logEntry));
  } else if (level === LogLevel.WARN) {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
};

export const logger = {
  info: (message: string, data?: Record<string, unknown>) =>
    log(LogLevel.INFO, message, data),
  warn: (message: string, data?: Record<string, unknown>) =>
    log(LogLevel.WARN, message, data),
  error: (message: string, data?: Record<string, unknown>) =>
    log(LogLevel.ERROR, message, data),
  debug: (message: string, data?: Record<string, unknown>) =>
    log(LogLevel.DEBUG, message, data),
};
