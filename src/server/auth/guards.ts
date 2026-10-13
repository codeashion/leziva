import { NextResponse } from "next/server";
import { authService, SanitizedUser, RequestContext } from "@/server/services/auth.service";
import { UnauthorizedError, ForbiddenError } from "@/utils/errors";
import { RoleType } from "@prisma/client";
import { rbacService } from "@/server/auth/rbac.service";
import { getServerEnv } from "@/shared/validations/env";
import crypto from "crypto";

/**
 * Extracts sanitized context information from the incoming request.
 */
export function extractRequestContext(req: Request): RequestContext {
  const headers = req.headers;
  const ipAddress =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = headers.get("user-agent") || "Unknown";
  const correlationId = headers.get("x-correlation-id") || crypto.randomUUID();

  return {
    ipAddress,
    userAgent,
    correlationId,
  };
}

/**
 * Extracts the session token from cookies or Authorization Bearer header.
 */
export function getSessionTokenFromRequest(req: Request): string | null {
  // 1. Check Cookie
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    let cookieName = "leziva_session";
    try {
      cookieName = getServerEnv().SESSION_COOKIE_NAME;
    } catch {
      // fallback
    }

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${cookieName}=`)) {
        return cookie.substring(cookieName.length + 1);
      }
    }
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Authenticates request and returns the user or null if anonymous.
 */
export async function authenticateRequest(req: Request): Promise<SanitizedUser | null> {
  const token = getSessionTokenFromRequest(req);
  if (!token) return null;
  return authService.validateSession(token);
}

/**
 * Guard: Requires the request to be authenticated.
 */
export async function requireAuth(req: Request): Promise<SanitizedUser> {
  const user = await authenticateRequest(req);
  if (!user) {
    throw new UnauthorizedError("Authentication is required to access this resource.");
  }
  return user;
}

/**
 * Guard: Requires the authenticated user to have at least one of the specified roles.
 */
export async function requireRoles(
  req: Request,
  allowedRoles: RoleType[]
): Promise<SanitizedUser> {
  const user = await requireAuth(req);

  const hasRole = user.roles.some(
    (role: RoleType) => role === RoleType.SUPER_ADMIN || allowedRoles.includes(role)
  );

  if (!hasRole) {
    throw new ForbiddenError(
      "Access forbidden: You do not have the required permissions for this action."
    );
  }

  return user;
}

/**
 * Guard: Requires the authenticated user to have a specific granular permission.
 */
export async function requirePermission(
  req: Request,
  permission: string
): Promise<SanitizedUser> {
  const user = await requireAuth(req);

  if (!rbacService.hasPermission(user.roles, permission)) {
    throw new ForbiddenError(
      `Access forbidden: Missing required permission '${permission}'.`
    );
  }

  return user;
}

/**
 * Guard: Requires the authenticated user to have at least one of the specified granular permissions.
 */
export async function requireAnyPermission(
  req: Request,
  permissions: string[]
): Promise<SanitizedUser> {
  const user = await requireAuth(req);

  if (!rbacService.hasAnyPermission(user.roles, permissions)) {
    throw new ForbiddenError(
      `Access forbidden: Missing required permissions. Required one of: ${permissions.join(", ")}.`
    );
  }

  return user;
}

/**
 * Sets the secure session cookie on a NextResponse.
 */
export function setSessionCookie(
  res: NextResponse,
  token: string,
  expiresAt: Date
): void {
  let cookieName = "leziva_session";
  let isProd = false;
  try {
    const env = getServerEnv();
    cookieName = env.SESSION_COOKIE_NAME;
    isProd = env.NODE_ENV === "production";
  } catch {
    // fallback
  }

  res.cookies.set({
    name: cookieName,
    value: token,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Clears the session cookie on a NextResponse.
 */
export function clearSessionCookie(res: NextResponse): void {
  let cookieName = "leziva_session";
  try {
    cookieName = getServerEnv().SESSION_COOKIE_NAME;
  } catch {
    // fallback
  }

  res.cookies.set({
    name: cookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

export const GUEST_CART_COOKIE_NAME = "lzv_guest_cart";
export const GUEST_WISHLIST_COOKIE_NAME = "lzv_guest_wishlist";

/**
 * Extracts guest cart ID from cookie or header.
 */
export function getGuestCartIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${GUEST_CART_COOKIE_NAME}=`)) {
        return cookie.substring(GUEST_CART_COOKIE_NAME.length + 1);
      }
    }
  }

  const customHeader = req.headers.get("x-guest-cart-id");
  if (customHeader) {
    return customHeader.trim();
  }

  return null;
}

/**
 * Extracts guest wishlist ID from cookie or header.
 */
export function getGuestWishlistIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${GUEST_WISHLIST_COOKIE_NAME}=`)) {
        return cookie.substring(GUEST_WISHLIST_COOKIE_NAME.length + 1);
      }
    }
  }

  const customHeader = req.headers.get("x-guest-wishlist-id");
  if (customHeader) {
    return customHeader.trim();
  }

  return null;
}

/**
 * Sets guest cart cookie on NextResponse.
 */
export function setGuestCartCookie(res: NextResponse, guestId: string): void {
  res.cookies.set({
    name: GUEST_CART_COOKIE_NAME,
    value: guestId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Clears guest cart cookie on NextResponse.
 */
export function clearGuestCartCookie(res: NextResponse): void {
  res.cookies.set({
    name: GUEST_CART_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
}

