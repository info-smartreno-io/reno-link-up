/**
 * Input sanitization utilities
 * Prevents XSS and other injection attacks
 */

/**
 * Sanitize string input by removing potentially dangerous characters
 * Preserves common punctuation and formatting
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '')
    .substring(0, 255);
}

/**
 * Sanitize phone number - keep only digits and common phone symbols
 */
export function sanitizePhone(phone: string): string {
  return phone
    .trim()
    .replace(/[^0-9\s()+-]/g, '')
    .substring(0, 20);
}

/**
 * Sanitize name - allow only letters, spaces, hyphens, and apostrophes
 */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z\s'-]/g, '')
    .substring(0, 100);
}

/**
 * Sanitize address
 */
export function sanitizeAddress(address: string): string {
  return address
    .trim()
    .replace(/[<>'"]/g, '')
    .substring(0, 200);
}

/**
 * Sanitize long text (message, description, etc.)
 */
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 5000);
}

/**
 * Check if input contains suspicious patterns
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /eval\(/i,
    /expression\(/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize form data object
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  fieldSanitizers: Partial<Record<keyof T, (value: any) => any>>
): T {
  const sanitized = { ...data };

  Object.entries(fieldSanitizers).forEach(([field, sanitizer]) => {
    if (sanitizer && field in sanitized) {
      sanitized[field as keyof T] = sanitizer(sanitized[field as keyof T]);
    }
  });

  return sanitized;
}

/**
 * Simple honeypot check
 * Add a hidden field to your form and check if it's filled
 */
export function checkHoneypot(value: string | undefined): boolean {
  return !value || value.trim() === '';
}
