import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Role } from "@/lib/constants";
import { cookies } from "next/headers";

// Lazy getter — evaluated per call, not at module load, so Next.js static
// analysis never throws during `next build` even when JWT_SECRET is absent.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: JWT_SECRET environment variable is missing in production.");
    }
    return "staysphere_dev_fallback_secret_key_32chars_min";
  }
  return secret;
}

export const TOKEN_COOKIE_NAME = "staysphere_token";

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  ownerId?: string;
  propertyId?: string;
  staffRole?: string;
  permissions?: string[];
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload, expiresIn: string | number = "7d"): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: expiresIn as any });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
