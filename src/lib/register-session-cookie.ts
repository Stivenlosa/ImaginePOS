import { authSecret } from "@/lib/session-auth";

export const REGISTER_SESSION_COOKIE = "imagine_register_session";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createRegisterSessionToken(sessionId: number) {
  const payload = toBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        sessionId,
        exp: Date.now() + MAX_AGE_SECONDS * 1000,
      }),
    ),
  );
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyRegisterSessionToken(token: string | undefined | null): Promise<number | null> {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const valid = await crypto.subtle.verify(
    "HMAC",
    await hmacKey(),
    fromBase64Url(signature),
    new TextEncoder().encode(payload),
  );
  if (!valid) return null;

  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      sessionId?: number;
      exp?: number;
    };
    if (typeof data.sessionId !== "number" || typeof data.exp !== "number" || data.exp < Date.now()) {
      return null;
    }
    return data.sessionId;
  } catch {
    return null;
  }
}

export function registerSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
