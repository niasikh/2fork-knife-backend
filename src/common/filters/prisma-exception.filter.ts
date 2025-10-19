import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': // Unique constraint violation
        status = HttpStatus.CONFLICT;
        message = 'A record with this information already exists';
        break;
      case 'P2025': // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003': // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced record does not exist';
        break;
      case 'P2014': // Invalid ID
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID provided';
        break;
      default:
        this.logger.error(`Unhandled Prisma error code: ${exception.code}`, exception.message);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      error: exception.code,
    };

    response.status(status).json(errorResponse);
  }
}
