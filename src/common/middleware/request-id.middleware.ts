import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request interface
declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to request
    req.requestId = requestId;

    // Add to response headers
    res.setHeader('x-request-id', requestId);

    next();
  }
}
