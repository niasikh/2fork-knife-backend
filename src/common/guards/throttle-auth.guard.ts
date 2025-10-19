import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Strict rate limiter for authentication endpoints
 * 100 requests per 15 minutes per IP
 */
@Injectable()
export class ThrottleAuthGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by IP address
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}
