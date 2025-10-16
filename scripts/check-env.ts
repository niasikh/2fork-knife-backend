#!/usr/bin/env ts-node

/**
 * Environment Variables Validation Script
 * Run before deployment to ensure all required variables are set
 * Usage: ts-node scripts/check-env.ts
 * CI Usage: CI=true ts-node scripts/check-env.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file if not in CI
if (!process.env.CI) {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    console.error('❌ .env file not found!');
    console.error('   Run: cp .env.example .env');
    process.exit(1);
  }
}

interface EnvCheck {
  name: string;
  required: boolean;
  validator?: (value: string) => boolean;
  description: string;
}

const ENV_CHECKS: EnvCheck[] = [
  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    validator: (v) => v.startsWith('postgresql://'),
    description: 'PostgreSQL connection string',
  },
  {
    name: 'DIRECT_URL',
    required: true,
    validator: (v) => v.startsWith('postgresql://'),
    description: 'PostgreSQL direct connection (pooling)',
  },

  // JWT
  {
    name: 'JWT_SECRET',
    required: true,
    validator: (v) => v.length >= 32,
    description: 'JWT secret (min 32 characters)',
  },
  {
    name: 'JWT_REFRESH_SECRET',
    required: true,
    validator: (v) => v.length >= 32,
    description: 'JWT refresh secret (min 32 characters)',
  },

  // Redis
  {
    name: 'REDIS_HOST',
    required: true,
    description: 'Redis host',
  },
  {
    name: 'REDIS_PORT',
    required: true,
    validator: (v) => !isNaN(parseInt(v)),
    description: 'Redis port',
  },

  // Stripe (if payments enabled)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    validator: (v: string) => v.startsWith('sk_'),
    description: 'Stripe secret key',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    required: false,
    validator: (v: string) => v.startsWith('whsec_'),
    description: 'Stripe webhook secret',
  },

  // Sentry (error tracking)
  {
    name: 'SENTRY_DSN',
    required: false,
    validator: (v: string) => v.startsWith('https://'),
    description: 'Sentry DSN for error tracking',
  },

  // App
  {
    name: 'PORT',
    required: false,
    validator: (v) => !isNaN(parseInt(v)),
    description: 'Application port',
  },
  {
    name: 'NODE_ENV',
    required: false,
    validator: (v) => ['development', 'production', 'test'].includes(v),
    description: 'Node environment',
  },
];

let hasErrors = false;
let hasWarnings = false;

console.log('\n🔍 Checking Environment Variables...\n');
console.log('─'.repeat(80));

for (const check of ENV_CHECKS) {
  const value = process.env[check.name];

  if (!value) {
    if (check.required) {
      console.error(`❌ ${check.name} - MISSING (Required)`);
      console.error(`   ${check.description}`);
      hasErrors = true;
    } else {
      console.warn(`⚠️  ${check.name} - Not set (Optional)`);
      console.warn(`   ${check.description}`);
      hasWarnings = true;
    }
    continue;
  }

  if (check.validator && !check.validator(value)) {
    console.error(`❌ ${check.name} - INVALID`);
    console.error(`   ${check.description}`);
    console.error(`   Current value does not pass validation`);
    hasErrors = true;
    continue;
  }

  console.log(`✅ ${check.name} - OK`);
}

console.log('─'.repeat(80));

if (hasErrors) {
  console.error('\n❌ Environment check FAILED!');
  console.error('Fix the errors above before starting the application.\n');
  process.exit(1);
}

if (hasWarnings) {
  console.warn('\n⚠️  Environment check passed with warnings.');
  console.warn('Some optional variables are not set.\n');
}

if (!hasErrors && !hasWarnings) {
  console.log('\n✅ All environment variables are properly configured!\n');
}

process.exit(0);

