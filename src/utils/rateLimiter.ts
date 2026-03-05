/**
 * Rate limiting utility for form submissions
 * Prevents spam and abuse by tracking submission attempts
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

const RATE_LIMIT_STORAGE_KEY = 'smartreno_rate_limit';
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

class RateLimiter {
  private getStoredData(): Record<string, RateLimitEntry> {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private setStoredData(data: Record<string, RateLimitEntry>): void {
    try {
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store rate limit data:', error);
    }
  }

  /**
   * Check if an identifier (e.g., email, IP) is rate limited
   */
  checkLimit(identifier: string): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now();
    const data = this.getStoredData();
    const entry = data[identifier];

    // No previous attempts
    if (!entry) {
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
    }

    // Window has expired, reset
    if (now - entry.firstAttempt > WINDOW_MS) {
      delete data[identifier];
      this.setStoredData(data);
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
    }

    // Check if limit exceeded
    if (entry.count >= MAX_ATTEMPTS) {
      const resetTime = entry.firstAttempt + WINDOW_MS;
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime 
      };
    }

    return { 
      allowed: true, 
      remainingAttempts: MAX_ATTEMPTS - entry.count - 1 
    };
  }

  /**
   * Record a submission attempt
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const data = this.getStoredData();
    const entry = data[identifier];

    if (!entry || now - entry.firstAttempt > WINDOW_MS) {
      // New entry or expired window
      data[identifier] = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
    } else {
      // Increment existing entry
      entry.count += 1;
      entry.lastAttempt = now;
    }

    this.setStoredData(data);
  }

  /**
   * Clear rate limit for an identifier (useful for testing or admin override)
   */
  clearLimit(identifier: string): void {
    const data = this.getStoredData();
    delete data[identifier];
    this.setStoredData(data);
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    const data = this.getStoredData();
    const cleaned: Record<string, RateLimitEntry> = {};

    Object.entries(data).forEach(([key, entry]) => {
      if (now - entry.firstAttempt <= WINDOW_MS) {
        cleaned[key] = entry;
      }
    });

    this.setStoredData(cleaned);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Format remaining time for user-friendly display
 */
export function formatResetTime(resetTime: number): string {
  const now = Date.now();
  const remaining = Math.max(0, resetTime - now);
  const minutes = Math.ceil(remaining / (60 * 1000));

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `${hours} hour${hours === 1 ? '' : 's'}`;
}
