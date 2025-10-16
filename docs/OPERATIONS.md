# 🔧 Operations Guide

## Database Migrations

### On Deploy (Automatic)

The start command includes migration deployment:
```bash
npm run prisma:migrate:deploy && npm run start:prod
```

This ensures database schema is always up-to-date.

### Manual Migration

```bash
# Development: Create and apply migration
npm run prisma:migrate:dev --name description_of_change

# Production: Deploy pending migrations
npm run prisma:migrate:deploy

# Check migration status
npx prisma migrate status

# Rollback (manual)
# Prisma doesn't support automatic rollback
# You must write DOWN migration SQL manually
```

### Migration Best Practices

1. **Always test migrations locally first**
2. **Create backup before migrating production**
3. **Migrations should be backward-compatible**
4. **Use transactions for data migrations**
5. **Monitor migration execution time**

---

## Secrets Rotation

### JWT Secrets

**Frequency**: Every 90 days or on suspected compromise

**Process**:
1. Generate new secrets:
   ```bash
   node scripts/generate-secrets.js
   ```

2. Update environment variables in deployment platform

3. Deploy new version

4. Old tokens will expire naturally (based on `JWT_EXPIRATION`)

5. Users may need to re-login

### Database Password

**Frequency**: Every 180 days

**Process**:
1. In Supabase: Settings → Database → Reset Password
2. Update `DATABASE_URL` and `DIRECT_URL` in deployment
3. Restart application
4. Test connection

### Stripe API Keys

**Frequency**: Annually or on team member departure

**Process**:
1. Create new keys in Stripe Dashboard
2. Update `STRIPE_SECRET_KEY` in environment
3. Update `STRIPE_WEBHOOK_SECRET` if webhooks change
4. Deploy
5. Delete old keys after verification

### Twilio Credentials

**Frequency**: Annually

**Process**:
1. Generate new Auth Token in Twilio Console
2. Update environment variables
3. Deploy
4. Revoke old token

---

## Backup and Restore

### Automated Backups (Supabase)

Supabase automatically backs up:
- **Free tier**: Daily backups, 7-day retention
- **Pro tier**: Daily backups, 30-day retention
- **Point-in-time recovery**: Available on Pro+

**Access**: Supabase Dashboard → Database → Backups

### Manual Backup

```bash
# Export database to SQL file
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
# Download backup from Supabase or your storage
# Restore (WARNING: This will overwrite current data)
psql $DATABASE_URL < backup-20251020.sql
```

### Backup Before Major Changes

```bash
# Before migrations
npm run prisma:migrate:deploy

# Before data migrations
# Run manual backup first
```

---

## Rollback Procedure

### Application Rollback

**If using Render/Fly**:
1. Go to Dashboard → Deployments
2. Find previous working deployment
3. Click "Redeploy" or "Rollback"

**If using Docker**:
```bash
# Use previous image tag
docker pull your-registry/fork-knife-backend:previous-tag
docker-compose down
docker-compose up -d
```

**If using Kubernetes**:
```bash
# Rollback deployment
kubectl rollout undo deployment/fork-knife-backend -n production

# Check rollout status
kubectl rollout status deployment/fork-knife-backend -n production
```

### Database Rollback

**Prisma doesn't support automatic migration rollback!**

Manual process:
1. Restore from backup (see above)
2. Or write reverse migration SQL manually
3. Apply with `psql $DATABASE_URL < rollback.sql`

---

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Application Health**
   - `/health` endpoint returns 200
   - Response time < 500ms
   - Error rate < 1%

2. **Database**
   - Connection pool usage < 80%
   - Query performance
   - Disk usage

3. **Redis**
   - Memory usage
   - Queue depth
   - Job processing rate

4. **API Performance**
   - Request rate
   - P95/P99 latency
   - Error rates by endpoint

### Set Up Alerts

**Recommended thresholds**:
- Health check fails 3 times in 5 minutes → Page on-call
- Error rate > 5% for 5 minutes → Alert team
- Database connections > 80% → Warning
- Disk usage > 85% → Alert
- Response time P95 > 1s → Warning

**Tools**:
- Supabase Dashboard (database metrics)
- Render/Fly metrics
- Sentry for error tracking
- Datadog/New Relic (optional)

---

## Scaling

### Horizontal Scaling

**Application**:
```bash
# Render: Auto-scaling in dashboard
# Kubernetes: Update replicas
kubectl scale deployment fork-knife-backend --replicas=5 -n production
```

**Worker**:
```bash
# Scale workers independently
kubectl scale deployment fork-knife-worker --replicas=3 -n production
```

### Vertical Scaling

**When to scale up**:
- CPU usage consistently > 70%
- Memory usage > 80%
- Response times degrading

**When to scale out** (horizontal):
- Consistent high load
- Need redundancy
- Geographic distribution

---

## Incident Response

### Service Down

1. **Check health endpoint**: `curl https://your-api.com/health`
2. **Check logs**: Dashboard → Logs or `kubectl logs`
3. **Check database**: Supabase status page
4. **Check Redis**: Connection test
5. **Rollback if needed**: See rollback procedure above

### Database Issues

1. **Check Supabase status**: https://status.supabase.com
2. **Verify connection**: Test with `psql`
3. **Check connection pool**: Monitor active connections
4. **Restart if hung**: Deployment platform

### High Error Rate

1. **Check logs for patterns**
2. **Identify failing endpoint**
3. **Check recent deployments**
4. **Rollback if regression**
5. **Apply hotfix if needed**

---

## Maintenance Windows

### Recommended Schedule

- **Dependency updates**: Monthly
- **Security patches**: As needed (within 24-48 hours)
- **Database maintenance**: Quarterly
- **Secrets rotation**: See schedule above

### Maintenance Checklist

- [ ] Notify users (if downtime expected)
- [ ] Create database backup
- [ ] Run in staging first
- [ ] Monitor metrics during change
- [ ] Verify health checks pass
- [ ] Test critical paths
- [ ] Document changes

---

## Logs and Debugging

### Access Logs

**Development**:
```bash
# Console output with color
npm run start:dev
```

**Production (Docker)**:
```bash
# View live logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# Worker logs
docker-compose logs -f worker
```

**Production (Kubernetes)**:
```bash
# Live logs
kubectl logs -f deployment/fork-knife-backend -n production

# Last hour
kubectl logs --since=1h deployment/fork-knife-backend -n production
```

### Log Rotation

Logs are written to `logs/` directory with automatic rotation:
- `error.log`: Error-level only
- `combined.log`: All logs
- Rotated daily
- Compressed after 7 days
- Deleted after 30 days

### Debug Mode

```bash
# Enable verbose logging
LOG_LEVEL=debug npm run start:dev
```

---

## Security Checklist

### Regular Security Tasks

- [ ] Update dependencies monthly
- [ ] Scan for vulnerabilities: `npm audit`
- [ ] Rotate secrets on schedule
- [ ] Review access logs for anomalies
- [ ] Check failed login attempts
- [ ] Audit user permissions
- [ ] Review API rate limits

### Security Incident Response

1. **Identify scope**: What was compromised?
2. **Rotate affected credentials immediately**
3. **Check audit logs**
4. **Notify affected users** (if data breach)
5. **Apply patches**
6. **Document incident**

---

## Performance Optimization

### Database

```bash
# Analyze slow queries in Supabase
# Dashboard → Database → Query Performance

# Add indexes if needed
# Create migration with new indexes
```

### Caching

```bash
# Monitor Redis hit rate
# Adjust TTL values in code
# Add caching for frequently accessed data
```

### API Optimization

- Enable compression (already configured)
- Use pagination for large datasets
- Implement field-level caching
- Optimize GraphQL queries

---

## Disaster Recovery

### Recovery Time Objective (RTO)

**Target**: < 4 hours for full recovery

### Recovery Point Objective (RPO)

**Target**: < 24 hours of data loss (daily backups)

### DR Plan

1. **Database**: Restore from Supabase backup
2. **Application**: Redeploy from GitHub
3. **Configuration**: Restore environment variables
4. **Verify**: Run health checks and smoke tests

### DR Test Schedule

- Quarterly backup restore tests
- Annual full DR drill

---

## Change Management

### Release Process

1. **Development**: Feature branch → PR → Code review
2. **Testing**: Automated tests must pass
3. **Staging**: Deploy to staging environment
4. **Production**: Deploy during low-traffic window
5. **Monitor**: Watch metrics for 30 minutes post-deploy

### Hotfix Process

1. Create hotfix branch from main
2. Apply minimal fix
3. Fast-track review
4. Deploy directly to production
5. Backport to development branches

---

## Contact Information

**On-Call Rotation**: [Link to PagerDuty/schedule]  
**Escalation Path**: Dev → Senior Dev → CTO  
**Emergency Contact**: [Emergency number]

---

**Last Updated**: October 2025  
**Owner**: Backend Team

