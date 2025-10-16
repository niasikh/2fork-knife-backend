# POS Connector Hub

**Separate microservice for POS system integrations**

This service handles all POS vendor integrations using the **Adapter Pattern**, allowing Fork & Knife to connect with multiple restaurant POS systems without tight coupling.

## Architecture

```
pos-connector-hub/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── adapters/              # Vendor-specific adapters
│   │   ├── base/
│   │   │   ├── pos-adapter.interface.ts
│   │   │   └── base-pos-adapter.ts
│   │   ├── syrve/             # Syrve/iiko adapter
│   │   ├── micros/            # Micros Simphony adapter
│   │   ├── fina/              # Fina (Georgia) adapter
│   │   └── suphra/            # Suphra adapter
│   ├── services/
│   │   ├── sync.service.ts    # Synchronization engine
│   │   ├── webhook.service.ts # Webhook handling
│   │   └── mapper.service.ts  # Data mapping
│   └── dto/
│       ├── reservation.dto.ts # Canonical schemas
│       └── venue.dto.ts
```

## Supported POS Systems

| Vendor | Status | Integration Type |
|--------|--------|------------------|
| **Syrve/iiko** | 🚧 Ready | Webhook + Polling |
| **Micros Simphony** | 🚧 Ready | Polling + Change Journals |
| **Fina (Georgia)** | 🚧 Ready | Push API + Status Read |
| **Suphra** | 🚧 Ready | Custom Adapter |

## Key Features

### 1. Adapter Pattern
Each POS vendor has its own adapter implementing a common interface:

```typescript
interface IPOSAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Reservation sync
  createReservation(data: CanonicalReservation): Promise<POSReservation>;
  updateReservation(id: string, data: Partial<CanonicalReservation>): Promise<void>;
  cancelReservation(id: string): Promise<void>;
  
  // Status sync
  getReservationStatus(id: string): Promise<ReservationStatus>;
  getTables(): Promise<Table[]>;
  
  // Webhook handling
  handleWebhook(payload: any): Promise<WebhookResult>;
}
```

### 2. Sync Engine
- **Bidirectional sync**: Fork & Knife ↔ POS
- **Real-time**: Webhooks when available
- **Fallback**: Polling with incremental cursors
- **Idempotency**: Duplicate prevention
- **Retry logic**: Exponential backoff with circuit breakers

### 3. Data Mapping
Canonical schema bridges Fork & Knife and vendor-specific formats:

```typescript
// Fork & Knife → POS
{
  reservation_id: "clx123",
  guest: { name, phone, email },
  party_size: 4,
  start_at: "2025-10-20T19:00:00Z",
  table_pref: "window"
}

// Maps to vendor format (e.g., Syrve)
{
  id: "vendor-specific-id",
  guestCount: 4,
  estimatedStartTime: "2025-10-20T19:00:00+04:00",
  customer: { ... },
  comment: "Window seating preferred"
}
```

### 4. Resilience
- **Circuit breakers**: Prevent cascade failures
- **Dead letter queue**: Failed operations for manual review
- **Audit trail**: Full sync history
- **Health monitoring**: Per-connector status

## Quick Start

### 1. Install Dependencies

```bash
cd pos-connector-hub
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your POS credentials
```

### 3. Run the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

The service runs on port **3100** by default.

## API Endpoints

### Health Check
```http
GET /health
```

### Connector Management
```http
GET  /connectors              # List all connectors
GET  /connectors/:vendor      # Get connector status
POST /connectors/:vendor/sync # Trigger manual sync
```

### Webhooks
```http
POST /webhooks/:vendor        # Receive POS webhooks
```

## Configuration Per Vendor

### Syrve/iiko
```env
SYRVE_ENABLED=true
SYRVE_BASE_URL=https://api-ru.iiko.services
SYRVE_API_LOGIN=your-api-login
SYRVE_ORG_ID=your-organization-id
```

### Micros Simphony
```env
MICROS_ENABLED=true
MICROS_BASE_URL=https://your-micros-instance.com
MICROS_API_KEY=your-api-key
MICROS_LOCATION_ID=your-location-id
```

### Fina (Georgia)
```env
FINA_ENABLED=true
FINA_BASE_URL=https://api.fina.ge
FINA_API_KEY=your-api-key
FINA_VENUE_ID=your-venue-id
```

## Data Flow

### Fork & Knife → POS (Outbound)
1. User creates reservation in Fork & Knife app
2. Main backend sends event to Connector Hub
3. Hub selects appropriate adapter
4. Adapter transforms to vendor format
5. Adapter pushes to POS via API
6. Confirmation sent back to main backend

### POS → Fork & Knife (Inbound)
1. POS sends webhook OR Hub polls POS
2. Adapter receives event (SEATED, CANCELLED, etc.)
3. Adapter transforms to canonical format
4. Hub sends to main backend API
5. Reservation status updated in main database

## Adding a New POS Vendor

1. Create adapter class:
```bash
src/adapters/newvendor/newvendor.adapter.ts
```

2. Implement `IPOSAdapter` interface

3. Add configuration in `.env`

4. Register in `adapters.module.ts`

5. Test with vendor sandbox

## Monitoring

### Metrics Tracked
- Sync success/failure rates
- API response times
- Queue depth
- Error rates per vendor

### Logs
Structured JSON logs with correlation IDs:
```json
{
  "timestamp": "2025-10-20T19:00:00Z",
  "level": "info",
  "vendor": "syrve",
  "operation": "createReservation",
  "reservationId": "clx123",
  "duration": 245,
  "status": "success"
}
```

## Deployment

### Docker
```bash
docker build -t pos-connector-hub .
docker run -p 3100:3100 --env-file .env pos-connector-hub
```

### With Main App
```bash
# In main backend directory
docker-compose up
```

The `docker-compose.yml` includes both services.

## Security

- **Credential encryption**: Vendor API keys encrypted at rest
- **API authentication**: Requires API key from main backend
- **Webhook verification**: Validates webhook signatures
- **Rate limiting**: Respects vendor limits

## Testing

```bash
npm test
```

## Troubleshooting

### Connection Failures
1. Check vendor credentials in `.env`
2. Verify network connectivity
3. Check vendor API status
4. Review logs for specific errors

### Sync Delays
1. Check SYNC_INTERVAL_SECONDS setting
2. Verify Redis connection
3. Check queue depth
4. Review vendor rate limits

## Support

For issues specific to POS integrations:
- Check vendor documentation
- Review adapter logs
- Contact vendor support
- Consult internal wiki

---

**Status**: Architecture complete, ready for vendor-specific implementation

This service is designed to be deployed independently and can scale horizontally as integration needs grow.

