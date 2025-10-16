# Apollo Server v4 → v5 Migration

## ⚠️ Deprecation Notice

Apollo Server v4 is deprecated and will reach end-of-life on **January 26, 2026**.

**Current Version**: `@apollo/server@4.9.5`  
**Target Version**: `@apollo/server@5.x`

---

## Migration Checklist

### Before Migration

- [ ] Review breaking changes: https://www.apollographql.com/docs/apollo-server/previous-versions
- [ ] Test all GraphQL queries in staging
- [ ] Update integration tests

### Changes Required

1. **Update Dependencies**:
```bash
npm install @apollo/server@5 @apollo/subgraph@2 @apollo/gateway@2
```

2. **Update Imports**:
```typescript
// Old (v4)
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';

// New (v5) - Check migration guide
```

3. **Update NestJS Integration**:
```typescript
// May need to update @nestjs/apollo and @nestjs/graphql
```

### Timeline

- **Test in Development**: Q1 2026
- **Deploy to Staging**: Before January 15, 2026
- **Deploy to Production**: Before January 26, 2026

### Resources

- Migration Guide: https://www.apollographql.com/docs/apollo-server/previous-versions
- Apollo v5 Changelog: https://github.com/apollographql/apollo-server/releases

---

**Status**: Tracked, migration scheduled for Q1 2026

