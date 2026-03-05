/**
 * Security Utilities
 * Input validation, rate limiting, and security headers
 */

import { z } from "zod";

/**
 * Rate Limiter (simple in-memory implementation)
 * For production, use Redis or similar
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if request is allowed
   * @param key - Unique identifier (IP, user ID, etc.)
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   */
  check(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    let timestamps = this.requests.get(key) || [];

    // Filter out old requests
    timestamps = timestamps.filter(time => time > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      return false;
    }

    // Add new request
    timestamps.push(now);
    this.requests.set(key, timestamps);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(windowStart);
    }

    return true;
  }

  private cleanup(before: number) {
    for (const [key, timestamps] of this.requests.entries()) {
      const filtered = timestamps.filter(time => time > before);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }

  reset(key: string) {
    this.requests.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * Common validation schemas using Zod
 */

// Email validation
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

// Phone validation (US format)
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[\d\s\-\(\)]+$/, { message: "Invalid phone number format" })
  .min(10, { message: "Phone number must be at least 10 digits" })
  .max(20, { message: "Phone number must be less than 20 characters" });

// Name validation
export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name cannot be empty" })
  .max(100, { message: "Name must be less than 100 characters" })
  .regex(/^[a-zA-Z\s\-']+$/, { message: "Name contains invalid characters" });

// Address validation
export const addressSchema = z
  .string()
  .trim()
  .min(5, { message: "Address must be at least 5 characters" })
  .max(200, { message: "Address must be less than 200 characters" });

// Message/description validation
export const messageSchema = z
  .string()
  .trim()
  .min(1, { message: "Message cannot be empty" })
  .max(2000, { message: "Message must be less than 2000 characters" });

// Zip code validation (US)
export const zipCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(-\d{4})?$/, { message: "Invalid zip code format" });

// URL validation
export const urlSchema = z
  .string()
  .trim()
  .url({ message: "Invalid URL format" })
  .max(500, { message: "URL must be less than 500 characters" });

/**
 * Composite validation schemas for forms
 */

// Contact form
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  message: messageSchema,
});

// Estimate request form
export const estimateRequestSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  projectType: z.string().min(1, { message: "Project type is required" }),
  message: messageSchema,
});

// Contractor application
export const contractorApplicationSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  companyName: z.string().trim().min(1).max(200),
  licenseNumber: z.string().trim().optional(),
  yearsExperience: z.number().min(0).max(100).optional(),
  serviceAreas: z.array(z.string()).min(1),
  specialties: z.array(z.string()).min(1),
});

/**
 * Sanitize HTML content
 * For production, use DOMPurify for comprehensive sanitization
 */
export function sanitizeHtml(html: string): string {
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validate and sanitize URL parameters
 */
export function sanitizeUrlParam(param: string | null): string {
  if (!param) return "";
  return param
    .trim()
    .replace(/[^\w\s\-]/g, "") // Only allow alphanumeric, spaces, hyphens
    .substring(0, 100);
}

/**
 * Security headers for API responses
 */
export const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://www.google-analytics.com;",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(self), microphone=(), camera=()",
};

/**
 * Validate rate limit before API call
 */
export function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; message?: string } {
  const key = `${identifier}:${action}`;
  const allowed = rateLimiter.check(key, maxRequests, windowMs);

  if (!allowed) {
    return {
      allowed: false,
      message: "Too many requests. Please try again later.",
    };
  }

  return { allowed: true };
}

/**
 * Generate CSRF token (simplified version)
 * For production, use a proper CSRF library
 */
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken;
}
