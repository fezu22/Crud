import RNFS from 'react-native-fs';
import { Buffer } from '@craftzdog/react-native-buffer';
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'react-native-quick-crypto';

let sessionKey = null;

// Password-reset TODO: a reset derives a new key; old encrypted media is unrecoverable
// until a password-reset key-wrapping scheme is explicitly implemented.
export function deriveSessionKey(password, saltBase64) {
  sessionKey = pbkdf2Sync(Buffer.from(password, 'utf8'), Buffer.from(saltBase64, 'base64'), 210000, 32, 'sha256');
  return sessionKey;
}

export function clearSessionKey() { sessionKey = null; }
export function hasSessionKey() { return Boolean(sessionKey); }

export async function encryptFile(file) {
  if (!sessionKey) throw new Error('Private media is locked. Please log in again.');
  const input = Buffer.from(await RNFS.readFile(file.uri.replace(/^file:\/\//, ''), 'base64'), 'base64');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', sessionKey, iv);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const path = `${RNFS.CachesDirectoryPath}/medi_${Date.now()}_${randomBytes(6).toString('hex')}.bin`;
  await RNFS.writeFile(path, encrypted.toString('base64'), 'base64');
  return { path, iv: iv.toString('base64'), authTag: authTag.toString('base64'), encryptedMimeType: file.type || 'application/octet-stream' };
}

export async function decryptBytes(base64, metadata) {
  if (!sessionKey) throw new Error('Private media is locked. Please log in again.');
  const decipher = createDecipheriv('aes-256-gcm', sessionKey, Buffer.from(metadata.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(metadata.authTag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(base64, 'base64')), decipher.final()]);
}
