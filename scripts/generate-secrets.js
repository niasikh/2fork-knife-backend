#!/usr/bin/env node

/**
 * Generate secure random secrets for JWT
 * Run: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

console.log('\n🔐 Generated Secure Secrets for Production\n');
console.log('Copy these to your .env file or deployment platform:\n');
console.log('─'.repeat(80));
console.log(`\nJWT_SECRET="${generateSecret()}"`);
console.log(`\nJWT_REFRESH_SECRET="${generateSecret()}"`);
console.log('\n' + '─'.repeat(80));
console.log('\n✅ These secrets are cryptographically secure and unique.');
console.log('⚠️  NEVER commit these to git or share them publicly!\n');

