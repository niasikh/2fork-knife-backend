/**
 * Common interface that all POS adapters must implement
 * This ensures consistency across different vendor integrations
 */

export interface CanonicalReservation {
  reservation_id: string;
  vendor_reservation_id?: string;
  restaurant_vendor_id: string;
  start_at: string; // ISO 8601
  party_size: number;
  guest: {
    name: string;
    phone: string;
    email: string;
    tags?: string[];
    notes?: string;
  };
  table_pref?: string;
  occasion?: string;
  source: 'fork-knife' | 'pos' | 'walk-in';
  hold?: {
    type: 'deposit' | 'prepay';
    amount_minor: number;
    currency: string;
    status: string;
  };
}

export interface POSStatusEvent {
  event_type: 'SEATED' | 'UNSEATED' | 'CANCELLED' | 'NO_SHOW' | 'CHECK_CLOSED';
  vendor_reservation_id: string;
  table_id?: string;
  occurred_at: string; // ISO 8601
  reason?: string;
  check_total_minor?: number;
}

export interface POSTable {
  id: string;
  vendor_id: string;
  area: string;
  number: string;
  min_seats: number;
  max_seats: number;
  status: 'available' | 'occupied' | 'reserved';
}

export interface ConnectionConfig {
  vendorName: string;
  baseUrl: string;
  apiKey?: string;
  credentials?: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
}

export interface IPOSAdapter {
  readonly vendorName: string;
  readonly isConnected: boolean;

  /**
   * Initialize connection to POS system
   */
  connect(config: ConnectionConfig): Promise<void>;

  /**
   * Disconnect from POS system
   */
  disconnect(): Promise<void>;

  /**
   * Test connection health
   */
  healthCheck(): Promise<boolean>;

  // ==================================
  // RESERVATION OPERATIONS
  // ==================================

  /**
   * Create a reservation in the POS system
   */
  createReservation(data: CanonicalReservation): Promise<{
    vendor_reservation_id: string;
    status: string;
  }>;

  /**
   * Update an existing reservation
   */
  updateReservation(
    vendorReservationId: string,
    data: Partial<CanonicalReservation>,
  ): Promise<void>;

  /**
   * Cancel a reservation in POS
   */
  cancelReservation(vendorReservationId: string, reason?: string): Promise<void>;

  /**
   * Get reservation status from POS
   */
  getReservationStatus(vendorReservationId: string): Promise<POSStatusEvent>;

  // ==================================
  // TABLE OPERATIONS
  // ==================================

  /**
   * Get all tables from POS
   */
  getTables(): Promise<POSTable[]>;

  /**
   * Get table status
   */
  getTableStatus(tableId: string): Promise<{
    status: 'available' | 'occupied' | 'reserved';
    current_reservation?: string;
  }>;

  // ==================================
  // WEBHOOK HANDLING
  // ==================================

  /**
   * Process webhook payload from POS
   * Returns null if webhook is not valid
   */
  handleWebhook(payload: any, signature?: string): Promise<POSStatusEvent | null>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean;
}

