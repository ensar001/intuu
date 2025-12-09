/**
 * Production-safe logger utility
 * Only logs in development mode, sends errors to tracking in production
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Log information (development only)
 * @param {...any} args - Arguments to log
 */
export const logInfo = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Log errors (always logs, can be extended with error tracking service)
 * @param {...any} args - Arguments to log
 */
export const logError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  } else {
    // In production, send to error tracking service (e.g., Sentry)
    // For now, just use console.error but this could be extended
    console.error('[Production Error]', ...args);
    
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(args[0]);
  }
};

/**
 * Log warnings (development only)
 * @param {...any} args - Arguments to log
 */
export const logWarn = (...args) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * Log debug information (development only)
 * @param {...any} args - Arguments to log
 */
export const logDebug = (...args) => {
  if (isDevelopment) {
    console.debug(...args);
  }
};

export default {
  info: logInfo,
  error: logError,
  warn: logWarn,
  debug: logDebug
};
