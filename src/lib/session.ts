import type { SessionUser, UserRole } from "@/types/user";

export const SESSION_COOKIE = "imagine_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const ROLES = new Set<UserRole>(["administrador", "cajero"]);

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return secret;
}

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

export async function createSessionToken(user: SessionUser) {
  const payload = toBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
      }),
    ),
  );
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
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
      id?: number;
      name?: string;
      username?: string;
      role?: string;
      exp?: number;
    };
    if (
      typeof data.id !== "number" ||
      typeof data.name !== "string" ||
      typeof data.username !== "string" ||
      typeof data.exp !== "number" ||
      !ROLES.has(data.role as UserRole) ||
      data.exp < Date.now()
    ) {
      return null;
    }
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      role: data.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
