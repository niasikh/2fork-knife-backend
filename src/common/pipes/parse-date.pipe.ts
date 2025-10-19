import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { parseISO, isValid } from 'date-fns';

@Injectable()
export class ParseDatePipe implements PipeTransform {
  transform(value: any): Date {
    if (!value) {
      throw new BadRequestException('Date is required');
    }

    const date = typeof value === 'string' ? parseISO(value) : value;

    if (!isValid(date)) {
      throw new BadRequestException('Invalid date format. Expected ISO 8601 format');
    }

    return date;
  }
}
