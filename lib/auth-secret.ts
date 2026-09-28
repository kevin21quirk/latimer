let cachedSecret: Uint8Array | null = null;

export function getAuthSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not set");
  }
  cachedSecret = new TextEncoder().encode(secret);
  return cachedSecret;
}
