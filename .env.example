# Environment Variables Template

Copy this to `.env` and fill in your values:

```bash
# ============================================
# DATABASE (Supabase PostgreSQL)
# ============================================
DATABASE_URL="postgresql://postgres:password@db.YOUR_PROJECT.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:password@db.YOUR_PROJECT.supabase.co:6543/postgres?pgbouncer=true"

# ============================================
# SUPABASE
# ============================================
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"

# ============================================
# JWT (Generate with: node scripts/generate-secrets.js)
# ============================================
JWT_SECRET="your-super-secret-min-32-characters-long"
JWT_EXPIRATION="7d"
JWT_REFRESH_SECRET="another-super-secret-min-32-characters-long"
JWT_REFRESH_EXPIRATION="30d"

# ============================================
# STRIPE
# ============================================
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_CURRENCY="GEL"

# ============================================
# SENTRY (Error Tracking)
# ============================================
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"

# ============================================
# REDIS
# ============================================
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# ============================================
# APPLICATION
# ============================================
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:3001"
ADMIN_PANEL_URL="http://localhost:3002"
API_PREFIX="api/v1"

# ============================================
# FEATURES
# ============================================
ENABLE_GRAPHQL="true"
ENABLE_POS_INTEGRATION="false"

# ============================================
# SETTINGS
# ============================================
DEFAULT_TIMEZONE="Asia/Tbilisi"
DEFAULT_LOCALE="ka-GE"
THROTTLE_TTL="60000"
THROTTLE_LIMIT="100"
LOG_LEVEL="debug"

# ============================================
# OPTIONAL (SMS/Email - can skip for initial setup)
# ============================================
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM=""
```

**Required for basic functionality**:
- DATABASE_URL, DIRECT_URL
- JWT_SECRET, JWT_REFRESH_SECRET
- REDIS_HOST, REDIS_PORT

**Recommended for production**:
- STRIPE keys (for payments)
- SENTRY_DSN (for error tracking)
- FRONTEND_URL, ADMIN_PANEL_URL (for CORS)

