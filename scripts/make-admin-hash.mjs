import { randomBytes, pbkdf2Sync } from 'node:crypto';
const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Usage: node scripts/make-admin-hash.mjs "A-strong-password-at-least-12-chars"');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const hash = pbkdf2Sync(password, salt, 210000, 32, 'sha256').toString('hex');
console.log(`ADMIN_PASSWORD_SALT=${salt}`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
