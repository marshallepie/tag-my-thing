// Utility functions for the application

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}

/**
 * Delays execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formats a number with commas for better readability
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates a random string of specified length
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}