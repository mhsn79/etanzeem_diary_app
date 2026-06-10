/**
 * Production-safe logging utility
 *
 * Only logs in development mode to prevent sensitive data exposure in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enableInProd?: boolean; // Only for critical errors
}

class Logger {
  private prefix: string;
  private enableInProd: boolean;

  constructor(options: LoggerOptions = {}) {
    this.prefix = options.prefix || '';
    this.enableInProd = options.enableInProd || false;
  }

  private shouldLog(level: LogLevel): boolean {
    // Always allow errors in production if enableInProd is true
    if (level === 'error' && this.enableInProd) {
      return true;
    }

    // Otherwise, only log in development
    return __DEV__;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return `${timestamp} ${prefix} [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      // Use console.warn in dev to avoid triggering React Native's red error overlay.
      // The [ERROR] prefix in the formatted message still clearly marks it as an error.
      if (__DEV__) {
        console.warn(this.formatMessage('error', message), ...args);
      } else {
        console.error(this.formatMessage('error', message), ...args);
      }
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      enableInProd: this.enableInProd,
    });
  }
}

// Export default logger instance
export const logger = new Logger();

// Export logger for specific modules
export const authLogger = new Logger({ prefix: 'Auth', enableInProd: true });
export const apiLogger = new Logger({ prefix: 'API' });
export const reduxLogger = new Logger({ prefix: 'Redux' });
export const uiLogger = new Logger({ prefix: 'UI' });

// Export Logger class for custom instances
export default Logger;
