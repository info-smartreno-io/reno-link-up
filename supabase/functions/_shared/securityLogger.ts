import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface SecurityEventData {
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  edgeFunction?: string;
  eventData?: Record<string, any>;
  errorMessage?: string;
  stackTrace?: string;
}

export class SecurityLogger {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Extract client IP from request headers
   */
  getClientIp(req: Request): string | undefined {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');

    return cfConnectingIp || realIp || forwardedFor?.split(',')[0].trim() || undefined;
  }

  /**
   * Extract user agent from request
   */
  getUserAgent(req: Request): string | undefined {
    return req.headers.get('user-agent') || undefined;
  }

  /**
   * Extract session/auth token info from request
   */
  getSessionId(req: Request): string | undefined {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return undefined;

    // Extract a hash of the token for tracking (don't log full token)
    const token = authHeader.replace('Bearer ', '');
    return token.substring(0, 16); // First 16 chars for session tracking
  }

  /**
   * Log a security event
   */
  async logEvent(data: SecurityEventData): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('log_security_event', {
        p_event_type: data.eventType,
        p_severity: data.severity,
        p_user_id: data.userId || null,
        p_session_id: data.sessionId || null,
        p_ip_address: data.ipAddress || null,
        p_user_agent: data.userAgent || null,
        p_edge_function: data.edgeFunction || null,
        p_event_data: data.eventData || {},
        p_error_message: data.errorMessage || null,
        p_stack_trace: data.stackTrace || null,
      });

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (err) {
      console.error('Security logger error:', err);
    }
  }

  /**
   * Log authentication failure
   */
  async logAuthFailure(
    req: Request,
    reason: string,
    userId?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: 'auth_failure',
      severity: 'medium',
      userId,
      sessionId: this.getSessionId(req),
      ipAddress: this.getClientIp(req),
      userAgent: this.getUserAgent(req),
      errorMessage: reason,
      eventData: additionalData,
    });
  }

  /**
   * Log invalid input/validation failure
   */
  async logValidationError(
    req: Request,
    edgeFunction: string,
    validationErrors: any,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'validation_error',
      severity: 'low',
      userId,
      sessionId: this.getSessionId(req),
      ipAddress: this.getClientIp(req),
      userAgent: this.getUserAgent(req),
      edgeFunction,
      errorMessage: 'Input validation failed',
      eventData: { errors: validationErrors },
    });
  }

  /**
   * Log rate limit violation
   */
  async logRateLimitExceeded(
    req: Request,
    edgeFunction: string,
    userId?: string,
    limit?: number
  ): Promise<void> {
    await this.logEvent({
      eventType: 'rate_limit_exceeded',
      severity: 'high',
      userId,
      sessionId: this.getSessionId(req),
      ipAddress: this.getClientIp(req),
      userAgent: this.getUserAgent(req),
      edgeFunction,
      errorMessage: 'Rate limit exceeded',
      eventData: { limit },
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    req: Request,
    edgeFunction: string,
    reason: string,
    userId?: string,
    eventData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: 'suspicious_activity',
      severity: 'high',
      userId,
      sessionId: this.getSessionId(req),
      ipAddress: this.getClientIp(req),
      userAgent: this.getUserAgent(req),
      edgeFunction,
      errorMessage: reason,
      eventData,
    });
  }

  /**
   * Log edge function error
   */
  async logEdgeFunctionError(
    req: Request,
    edgeFunction: string,
    error: Error,
    userId?: string,
    eventData?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: 'edge_function_error',
      severity: 'medium',
      userId,
      sessionId: this.getSessionId(req),
      ipAddress: this.getClientIp(req),
      userAgent: this.getUserAgent(req),
      edgeFunction,
      errorMessage: error.message,
      stackTrace: error.stack,
      eventData,
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(
    req: Request,
    edgeFunction: string,
    resource: string,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'unauthorized_access',
      severity: 'high',
      userId,
      sessionId: this.getSessionId(req),
      ipAddress: this.getClientIp(req),
      userAgent: this.getUserAgent(req),
      edgeFunction,
      errorMessage: `Unauthorized access attempt to ${resource}`,
      eventData: { resource },
    });
  }

  /**
   * Check for brute force patterns
   */
  async checkBruteForce(req: Request, eventType: string): Promise<boolean> {
    const ipAddress = this.getClientIp(req);
    if (!ipAddress) return false;

    try {
      const { data, error } = await this.supabase.rpc('detect_brute_force', {
        p_ip_address: ipAddress,
        p_event_type: eventType,
      });

      if (error) {
        console.error('Brute force check failed:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Brute force detection error:', err);
      return false;
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  async checkSuspiciousActivity(userId: string, eventType: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('detect_suspicious_activity', {
        p_user_id: userId,
        p_event_type: eventType,
      });

      if (error) {
        console.error('Suspicious activity check failed:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Suspicious activity detection error:', err);
      return false;
    }
  }
}

export const securityLogger = new SecurityLogger();
