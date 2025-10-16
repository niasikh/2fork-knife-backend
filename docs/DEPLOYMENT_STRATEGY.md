# 🚀 Fork & Knife - Production Deployment Strategy

## 🏗️ Recommended Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Vercel)                                      │
│  ├─ Mobile App API calls ──────────┐                   │
│  └─ Admin Panel ───────────────────┼──────┐            │
│                                     │      │            │
│  Backend API + Worker (Fly.io)     │      │            │
│  ├─ API Service (Port 3000) ◄──────┘      │            │
│  ├─ Worker Service (BullMQ) ◄─────────────┘            │
│  └─ POS Connector (Port 3100) - Optional               │
│                                                         │
│  Database (Supabase PostgreSQL)                         │
│  └─ Managed, auto-backup, pooling                      │
│                                                         │
│  Redis (Upstash/Redis Cloud)                            │
│  └─ Queues + caching                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Deployment Platform Choices

### **Frontend → Vercel** ✅

**Why Vercel:**
- Optimized for React/Next.js and React Native web
- Global CDN
- Automatic HTTPS
- Zero-config deployments
- Free tier generous

**Deploy**:
```bash
# Frontend repo
vercel --prod
```

### **Backend API + Worker → Fly.io** ✅ (Primary)

**Why Fly.io:**
- Deploy near your users (can deploy to Europe/Georgia region)
- PostgreSQL optimized
- Background workers supported
- Affordable ($5-20/month)
- Redis add-on available

**Alternative: Render.com** (See "Alternative Platforms" below)

### **Database → Supabase** ✅

**Why Supabase:**
- Managed PostgreSQL
- Automatic backups
- Connection pooling built-in
- Generous free tier
- Great developer experience

### **Redis → Upstash** ✅

**Why Upstash:**
- Serverless Redis
- Pay per request
- Free tier: 10K requests/day
- Great with Fly.io

**Alternative**: Fly.io Redis or Redis Cloud

---

## 🚀 Step-by-Step: Deploy to Fly.io

### **Prerequisites**

1. Install Fly CLI:
```bash
brew install flyctl
# or
curl -L https://fly.io/install.sh | sh
```

2. Sign up and login:
```bash
fly auth signup
# or
fly auth login
```

### **Step 1: Deploy API Service**

```bash
cd fork-knife-backend

# Initialize Fly app
fly launch

# Follow prompts:
# - App name: fork-knife-api
# - Region: Choose closest to Georgia (e.g., fra - Frankfurt)
# - PostgreSQL: No (we're using Supabase)
# - Redis: Yes (or use Upstash)
```

This creates `fly.toml` configuration file.

### **Step 2: Configure Secrets**

```bash
# Database
fly secrets set DATABASE_URL="postgresql://..." \
  DIRECT_URL="postgresql://..."

# JWT
fly secrets set JWT_SECRET="your-jwt-secret" \
  JWT_REFRESH_SECRET="your-refresh-secret"

# Stripe
fly secrets set STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..."

# Other
fly secrets set DEFAULT_TIMEZONE="Asia/Tbilisi" \
  NODE_ENV="production"
```

### **Step 3: Deploy**

```bash
# Deploy
fly deploy

# Check status
fly status

# View logs
fly logs

# Your API is live at:
# https://fork-knife-api.fly.dev
```

### **Step 4: Deploy Worker (Separate Process)**

Edit `fly.toml` to add worker process:

```toml
[processes]
  app = "npm run start:prod"
  worker = "npm run start:worker"

[[services]]
  processes = ["app"]  # Only app gets HTTP
  http_checks = []
  internal_port = 3000
  protocol = "tcp"
  
  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

Scale worker:
```bash
fly scale count app=2 worker=1
```

---

## 🔄 Alternative: Deploy to Render.com

### **Quick Setup**

1. **Create Web Service**:
   - Connect GitHub repo: `niasikh/2fork-knife-backend`
   - Build: `npm install && npm run prisma:generate && npm run build`
   - Start: `npm run prisma:migrate:deploy && npm run start:prod`

2. **Add Background Worker**:
   - New → Background Worker
   - Same repo
   - Start: `npm run start:worker`

3. **Add Redis**:
   - New → Redis
   - Copy internal URL to env vars

4. **Environment Variables**:
   - Add all secrets (same as Fly)

**Cost**: $7/month API + $7/month worker + $10/month Redis = $24/month

---

## 🌍 Vercel Frontend Deployment

### **Mobile App Backend Config**

```typescript
// restaurant-reservation-app/config/api.ts
export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://fork-knife-api.fly.dev/api/v1',
  graphqlURL: process.env.EXPO_PUBLIC_GRAPHQL_URL || 'https://fork-knife-api.fly.dev/graphql',
  timeout: 10000,
};
```

### **Admin Panel (if using Next.js)**

```bash
cd admin-panel
vercel --prod

# Set environment variables in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://fork-knife-api.fly.dev/api/v1
```

---

## 📊 Cost Comparison

### **Option 1: Fly.io + Supabase** (Recommended)

| Service | Plan | Cost |
|---------|------|------|
| Fly.io API | Shared CPU 256MB | $5/month |
| Fly.io Worker | Shared CPU 256MB | $5/month |
| Supabase | Pro | $25/month |
| Upstash Redis | Pay-as-you-go | ~$5/month |
| **Total** | | **~$40/month** |

### **Option 2: Render + Supabase**

| Service | Plan | Cost |
|---------|------|------|
| Render API | Starter | $7/month |
| Render Worker | Starter | $7/month |
| Render Redis | 100MB | $10/month |
| Supabase | Pro | $25/month |
| **Total** | | **$49/month** |

### **Option 3: All-in-One (Heroku)**

| Service | Plan | Cost |
|---------|------|------|
| Heroku Dyno | Hobby | $7/month |
| Heroku Worker | Hobby | $7/month |
| Heroku Redis | Mini | $15/month |
| Heroku Postgres | Standard-0 | $50/month |
| **Total** | | **$79/month** |

**Winner**: Fly.io + Supabase = Best price/performance

---

## ✅ Pre-Deployment Checklist

- [ ] All tests passing: `npm test`
- [ ] Environment check: `npm run check:env`
- [ ] Database migrations tested in staging
- [ ] Strong JWT secrets generated
- [ ] Stripe keys configured (test mode for staging)
- [ ] CORS URLs configured
- [ ] Frontend URLs set correctly
- [ ] Health checks returning 200 OK
- [ ] Logs configured
- [ ] Monitoring set up
- [ ] Backup strategy documented
- [ ] Incident response plan ready

---

## 🔒 Security Hardening

### **Fly.io Specific**

```bash
# Enable always-on HTTPS
fly certs add your-domain.com

# Set up Firewall (restrict to specific IPs if needed)
# Done in fly.toml

# Enable automatic security updates
# Automatic via Fly
```

### **Environment Variables**

```bash
# NEVER commit .env to git (already in .gitignore)
# Use platform secrets management:
fly secrets list         # Fly.io
render secrets list      # Render
```

---

## 📈 Post-Deployment

### **Immediate (First Hour)**

1. Monitor logs for errors
2. Test all critical endpoints
3. Verify database connectivity
4. Check Redis queue processing
5. Test reservation creation flow

### **First 24 Hours**

1. Monitor error rates
2. Check performance metrics
3. Verify scheduled jobs run
4. Test notification delivery
5. Monitor database load

### **First Week**

1. Review logs for patterns
2. Optimize slow queries
3. Adjust rate limits if needed
4. Scale if necessary
5. Document any issues

---

## 🆘 Troubleshooting

### **"Database connection failed"**

```bash
# Test connection
fly ssh console
npm run prisma:studio

# Check connection string
fly secrets list | grep DATABASE
```

### **"Worker not processing jobs"**

```bash
# Check worker logs
fly logs -a fork-knife-api --process worker

# Verify Redis connection
fly redis status
```

### **"High latency"**

1. Check database query performance
2. Add caching where needed
3. Scale horizontally
4. Use CDN for static assets

---

**Next**: See [OPERATIONS.md](./OPERATIONS.md) for ongoing maintenance

