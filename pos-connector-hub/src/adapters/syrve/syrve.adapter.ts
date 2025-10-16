import { Injectable } from '@nestjs/common';
import { BasePOSAdapter } from '../base/base-pos-adapter';
import {
  CanonicalReservation,
  POSStatusEvent,
  POSTable,
} from '../base/pos-adapter.interface';

/**
 * Syrve/iiko POS Adapter
 * Documentation: https://api-ru.iiko.services/
 */
@Injectable()
export class SyrveAdapter extends BasePOSAdapter {
  constructor() {
    super('Syrve');
  }

  protected async doConnect(): Promise<void> {
    // TODO: Implement Syrve authentication
    // 1. POST /api/1/access_token with credentials
    // 2. Store access token
    this.logOperation('Connecting to Syrve API');
  }

  protected async doDisconnect(): Promise<void> {
    // Clear tokens
    this.logOperation('Disconnecting from Syrve');
  }

  protected async doHealthCheck(): Promise<boolean> {
    // TODO: Ping Syrve API
    return true;
  }

  async createReservation(data: CanonicalReservation): Promise<{
    vendor_reservation_id: string;
    status: string;
  }> {
    this.logOperation('Creating reservation in Syrve', data);

    // TODO: Transform canonical format to Syrve format
    const syrvePayload = {
      organizationId: this.config.credentials.orgId,
      terminalGroupId: data.restaurant_vendor_id,
      estimatedStartTime: data.start_at,
      durationInMinutes: 120,
      guestCount: data.party_size,
      customer: {
        name: data.guest.name,
        phone: data.guest.phone,
      },
      comment: [data.guest.notes, data.table_pref].filter(Boolean).join('; '),
    };

    // TODO: POST /api/1/reserve/create
    // Return vendor ID

    return {
      vendor_reservation_id: 'SYRVE-' + Date.now(),
      status: 'confirmed',
    };
  }

  async updateReservation(
    vendorReservationId: string,
    data: Partial<CanonicalReservation>,
  ): Promise<void> {
    this.logOperation('Updating Syrve reservation', { vendorReservationId, data });
    // TODO: PUT /api/1/reserve/update
  }

  async cancelReservation(vendorReservationId: string, reason?: string): Promise<void> {
    this.logOperation('Cancelling Syrve reservation', { vendorReservationId, reason });
    // TODO: DELETE /api/1/reserve/{id}
  }

  async getReservationStatus(vendorReservationId: string): Promise<POSStatusEvent> {
    // TODO: GET /api/1/reserve/{id}
    return {
      event_type: 'SEATED',
      vendor_reservation_id: vendorReservationId,
      occurred_at: new Date().toISOString(),
    };
  }

  async getTables(): Promise<POSTable[]> {
    // TODO: GET /api/1/terminal_groups and extract tables
    return [];
  }

  async getTableStatus(tableId: string): Promise<{
    status: 'available' | 'occupied' | 'reserved';
    current_reservation?: string;
  }> {
    return { status: 'available' };
  }

  async handleWebhook(payload: any, signature?: string): Promise<POSStatusEvent | null> {
    if (!this.verifyWebhookSignature(payload, signature)) {
      this.logger.warn('Invalid webhook signature from Syrve');
      return null;
    }

    // TODO: Parse Syrve webhook payload
    // Transform to canonical POSStatusEvent
    return null;
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    // TODO: Implement Syrve signature verification
    return true;
  }
}

