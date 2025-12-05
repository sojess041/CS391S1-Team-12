// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  eventId?: string;
  [key: string]: any;
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = { timestamp, level: level.toUpperCase(), message, ...context };

    if (this.isDev) {
      console[level === 'debug' ? 'log' : level](`[${level.toUpperCase()}] ${message}`, context || '');
    } else {
      console.log(JSON.stringify(logData));
    }
  }

  debug(message: string, context?: LogContext) { this.log('debug', message, context); }
  info(message: string, context?: LogContext) { this.log('info', message, context); }
  warn(message: string, context?: LogContext) { this.log('warn', message, context); }
  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, { ...context, error: error?.message, stack: error?.stack });
  }
}

export const logger = new Logger();