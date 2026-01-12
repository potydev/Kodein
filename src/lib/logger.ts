/**
 * Safe logger utility that only logs in development mode
 * Prevents sensitive data from being exposed in production
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

/**
 * Log only in development mode
 */
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Log errors (always logged, but sanitized in production)
 */
export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  } else {
    // In production, only log error messages without sensitive data
    const sanitized = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized: any = {};
        // Only include safe fields
        if ('message' in arg) sanitized.message = arg.message;
        if ('code' in arg) sanitized.code = arg.code;
        return sanitized;
      }
      return typeof arg === 'string' ? arg : '[Object]';
    });
    console.error(...sanitized);
  }
};

/**
 * Log warnings (always logged, but sanitized in production)
 */
export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  } else {
    // In production, sanitize warnings
    const sanitized = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        const sanitized: any = {};
        if ('message' in arg) sanitized.message = arg.message;
        return sanitized;
      }
      return typeof arg === 'string' ? arg : '[Object]';
    });
    console.warn(...sanitized);
  }
};

/**
 * Sanitize object to remove sensitive data
 */
const sanitizeObject = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveKeys = ['userId', 'user_id', 'lessonId', 'lesson_id', 'courseId', 'course_id', 'id', 'email', 'token', 'password', 'secret', 'key'];
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Log with automatic sanitization in production
 */
export const safeLog = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(message, data);
  } else {
    // In production, sanitize sensitive data
    const sanitized = data ? sanitizeObject(data) : undefined;
    console.log(message, sanitized);
  }
};

