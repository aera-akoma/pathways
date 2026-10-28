import crypto from 'crypto';

/**
 * Hash a plain text password using scrypt
 * @param {string} password 
 * @returns {{ salt: string, hash: string }}
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

/**
 * Verify a plain text password against stored salt and hash
 * @param {string} password 
 * @param {string} salt 
 * @param {string} storedHash 
 * @returns {boolean}
 */
export function verifyPassword(password, salt, storedHash) {
  if (!password || !salt || !storedHash) return false;
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
  } catch {
    return false;
  }
}
