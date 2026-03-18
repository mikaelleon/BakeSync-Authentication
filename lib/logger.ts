/**
 * Centralized logging and error handling service
 * Provides consistent error tracking and reporting across the application
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: Date
  level: LogLevel
  message: string
  data?: Record<string, any>
  error?: Error
}

class Logger {
  private logs: LogEntry[] = []
  private isDevelopment = typeof window !== 'undefined' ? process.env.NODE_ENV === 'development' : true

  /**
   * Log a debug message (development only)
   */
  debug(message: string, data?: Record<string, any>) {
    this.log('debug', message, data)
  }

  /**
   * Log an informational message
   */
  info(message: string, data?: Record<string, any>) {
    this.log('info', message, data)
  }

  /**
   * Log a warning
   */
  warn(message: string, data?: Record<string, any>, error?: Error) {
    this.log('warn', message, data, error)
  }

  /**
   * Log an error
   */
  error(message: string, data?: Record<string, any>, error?: Error) {
    this.log('error', message, data, error)
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      error
    }

    this.logs.push(entry)

    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500)
    }

    // Console output in development
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(level)
      console.log(`%c[${level.toUpperCase()}] ${message}`, style, data, error)
    }

    // In production, only log errors
    if (!this.isDevelopment && level === 'error') {
      // Could send to error tracking service here
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #999; font-size: 12px;',
      info: 'color: #0066cc; font-weight: bold;',
      warn: 'color: #ff9900; font-weight: bold;',
      error: 'color: #cc0000; font-weight: bold;'
    }
    return styles[level]
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = []
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Export singleton instance
export const logger = new Logger()

/**
 * Error handling helper for async operations
 * Standardizes error handling across the app
 */
export async function handleAsyncError<T>(
  operation: () => Promise<T>,
  operationName: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation()
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error(`${operationName} failed`, {}, error)

    if (fallbackValue !== undefined) {
      return fallbackValue
    }

    throw error
  }
}
