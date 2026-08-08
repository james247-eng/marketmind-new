const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getEncryptionKey() {
  const configured = process.env.TOKEN_ENCRYPTION_KEY;
  if (!configured) throw new Error('TOKEN_ENCRYPTION_KEY is not configured');

  const key = /^[0-9a-f]{64}$/i.test(configured)
    ? Buffer.from(configured, 'hex')
    : Buffer.from(configured, 'base64');

  if (key.length !== KEY_LENGTH) {
    throw new Error('TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes');
  }
  return key;
}

function encryptToken(value) {
  if (value == null || value === '') return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  return {
    version: 1,
    algorithm: ALGORITHM,
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
    ciphertext: ciphertext.toString('base64'),
  };
}

function decryptToken(payload) {
  if (!payload) return null;
  if (typeof payload === 'string') throw new Error('Encrypted token payload is invalid');
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(payload.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encryptToken, decryptToken };
