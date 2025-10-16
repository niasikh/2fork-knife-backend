import { Logger } from '@nestjs/common';
import {
  IPOSAdapter,
  ConnectionConfig,
  CanonicalReservation,
  POSStatusEvent,
  POSTable,
} from './pos-adapter.interface';

/**
 * Base class with common functionality for all POS adapters
 * Vendor-specific adapters extend this class
 */
export abstract class BasePOSAdapter implements IPOSAdapter {
  protected readonly logger: Logger;
  protected config: ConnectionConfig;
  protected _isConnected = false;

  constructor(public readonly vendorName: string) {
    this.logger = new Logger(`${vendorName}Adapter`);
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(config: ConnectionConfig): Promise<void> {
    this.logger.log(`Connecting to ${this.vendorName}...`);
    this.config = config;

    try {
      await this.doConnect();
      this._isConnected = true;
      this.logger.log(`✅ Connected to ${this.vendorName}`);
    } catch (error) {
      this.logger.error(`❌ Failed to connect to ${this.vendorName}`, error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.logger.log(`Disconnecting from ${this.vendorName}...`);
    await this.doDisconnect();
    this._isConnected = false;
  }

  async healthCheck(): Promise<boolean> {
    try {
      return await this.doHealthCheck();
    } catch (error) {
      this.logger.error(`Health check failed for ${this.vendorName}`, error);
      return false;
    }
  }

  // Abstract methods that must be implemented by each vendor
  protected abstract doConnect(): Promise<void>;
  protected abstract doDisconnect(): Promise<void>;
  protected abstract doHealthCheck(): Promise<boolean>;

  // These must be implemented by each vendor adapter
  abstract createReservation(data: CanonicalReservation): Promise<{
    vendor_reservation_id: string;
    status: string;
  }>;

  abstract updateReservation(
    vendorReservationId: string,
    data: Partial<CanonicalReservation>,
  ): Promise<void>;

  abstract cancelReservation(vendorReservationId: string, reason?: string): Promise<void>;

  abstract getReservationStatus(vendorReservationId: string): Promise<POSStatusEvent>;

  abstract getTables(): Promise<POSTable[]>;

  abstract getTableStatus(tableId: string): Promise<{
    status: 'available' | 'occupied' | 'reserved';
    current_reservation?: string;
  }>;

  abstract handleWebhook(payload: any, signature?: string): Promise<POSStatusEvent | null>;

  abstract verifyWebhookSignature(payload: any, signature: string): boolean;

  /**
   * Helper: Retry logic with exponential backoff
   */
  protected async retry<T>(
    operation: () => Promise<T>,
    attempts = 3,
    delay = 1000,
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await this.sleep(delay * Math.pow(2, i));
      }
    }
    throw new Error('Max retry attempts reached');
  }

  /**
   * Helper: Sleep for specified milliseconds
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper: Log operation with context
   */
  protected logOperation(operation: string, data?: any): void {
    this.logger.log(`[${this.vendorName}] ${operation}`, data);
  }
}

