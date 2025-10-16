import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as canonicalReservationSchema from '../../contracts/pos/canonical-reservation.schema.json';
import * as statusEventSchema from '../../contracts/pos/status-event.schema.json';

const ajv = new Ajv();
addFormats(ajv);

describe('POS Contract Validation', () => {
  describe('Canonical Reservation Schema', () => {
    const validate = ajv.compile(canonicalReservationSchema);

    it('should validate valid reservation payload', () => {
      const validPayload = {
        reservation_id: 'clx123456789',
        restaurant_vendor_id: 'rest_001',
        start_at: '2025-10-20T19:00:00Z',
        party_size: 4,
        guest: {
          name: 'John Doe',
          phone: '+995555123456',
          email: 'john@example.com',
          tags: ['VIP'],
          notes: 'Window seat preferred',
        },
        table_pref: 'window',
        occasion: 'birthday',
        source: 'fork-knife',
      };

      const valid = validate(validPayload);
      expect(valid).toBe(true);
      expect(validate.errors).toBeNull();
    });

    it('should reject payload missing required fields', () => {
      const invalidPayload = {
        reservation_id: 'clx123',
        // Missing restaurant_vendor_id
        start_at: '2025-10-20T19:00:00Z',
        party_size: 4,
      };

      const valid = validate(invalidPayload);
      expect(valid).toBe(false);
      expect(validate.errors).toBeDefined();
    });

    it('should reject invalid party size', () => {
      const invalidPayload = {
        reservation_id: 'clx123',
        restaurant_vendor_id: 'rest_001',
        start_at: '2025-10-20T19:00:00Z',
        party_size: 0, // Invalid
        guest: {
          name: 'Test',
          phone: '+995555123456',
        },
        source: 'fork-knife',
      };

      const valid = validate(invalidPayload);
      expect(valid).toBe(false);
    });
  });

  describe('POS Status Event Schema', () => {
    const validate = ajv.compile(statusEventSchema);

    it('should validate SEATED event', () => {
      const validEvent = {
        event_type: 'SEATED',
        vendor_reservation_id: 'POS-123',
        table_id: 'table-5',
        occurred_at: '2025-10-20T19:05:00Z',
      };

      const valid = validate(validEvent);
      expect(valid).toBe(true);
    });

    it('should validate CHECK_CLOSED event with total', () => {
      const validEvent = {
        event_type: 'CHECK_CLOSED',
        vendor_reservation_id: 'POS-123',
        occurred_at: '2025-10-20T21:30:00Z',
        check_total_minor: 15000, // 150.00 GEL
      };

      const valid = validate(validEvent);
      expect(valid).toBe(true);
    });

    it('should reject invalid event type', () => {
      const invalidEvent = {
        event_type: 'INVALID_TYPE',
        vendor_reservation_id: 'POS-123',
        occurred_at: '2025-10-20T19:05:00Z',
      };

      const valid = validate(invalidEvent);
      expect(valid).toBe(false);
    });
  });
});

