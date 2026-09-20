import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const secretKey = process.env.AUTH_SECRET || 'secret-key-fallback-min-32-chars-length!!';
const key = new TextEncoder().encode(secretKey);

export const SESSION_COOKIE_NAME = 'med_session';
export const SESSION_MAX_AGE = 36 * 60 * 60; // 36 horas em segundos

export async function createSessionToken(payload: { authenticated: boolean }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('36h')
    .sign(key);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.AUTH_PASSWORD_HASH;
  if (!hash) {
    console.warn('AUTH_PASSWORD_HASH não definido no ambiente.');
    return false;
  }
  return await bcrypt.compare(password, hash);
}
