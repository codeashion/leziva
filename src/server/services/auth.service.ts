import { userRepository } from "@/server/repositories/user.repository";
import { sessionRepository } from "@/server/repositories/session.repository";
import { auditRepository } from "@/server/repositories/audit.repository";
import { prisma } from "@/server/db/prisma";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { generateSecureToken, hashToken, normalizeEmail } from "@/server/auth/tokens";
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
} from "@/shared/validations/auth";
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
  AppError,
} from "@/utils/errors";
import { RoleType, UserStatus } from "@prisma/client";

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface SanitizedUser {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  roles: RoleType[];
  createdAt: Date;
}

export class AuthService {
  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string | null;
    status: UserStatus;
    createdAt: Date;
    userRoles?: Array<{ role: { name: RoleType } }>;
  }): SanitizedUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      roles: user.userRoles?.map((ur) => ur.role.name) || [RoleType.CUSTOMER],
      createdAt: user.createdAt,
    };
  }

  /**
   * Registers a new customer account.
   * Public registration is strictly restricted to the CUSTOMER role.
   */
  async register(input: RegisterInput, ctx: RequestContext) {
    const normalized = normalizeEmail(input.email);
    const existing = await userRepository.findByNormalizedEmail(normalized);

    if (existing) {
      throw new ConflictError("An account with this email address already exists.");
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.createUser({
      email: input.email,
      normalizedEmail: normalized,
      passwordHash,
      name: input.name,
      status: UserStatus.ACTIVE,
      initialRole: RoleType.CUSTOMER, // Guaranteed CUSTOMER assignment
    });

    if (!user) {
      throw new AppError("Failed to initialize user record.");
    }

    // Generate secure session
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await sessionRepository.createSession({
      userId: user.id,
      sessionTokenHash: tokenHash,
      expiresAt,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    await auditRepository.recordLog({
      actorId: user.id,
      action: "AUTH_REGISTER_SUCCESS",
      resourceType: "USER",
      resourceId: user.id,
      correlationId: ctx.correlationId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { role: RoleType.CUSTOMER },
    });

    return {
      user: this.sanitizeUser(user),
      sessionToken: rawToken,
      expiresAt,
    };
  }

  /**
   * Authenticates user credentials and issues a server-managed session.
   */
  async login(input: LoginInput, ctx: RequestContext) {
    const normalized = normalizeEmail(input.email);
    const user = await userRepository.findByNormalizedEmail(normalized);

    // Uniform timing / error message to mitigate user enumeration
    if (!user || !user.passwordHash || user.status !== UserStatus.ACTIVE) {
      await auditRepository.recordLog({
        actorId: null,
        action: "AUTH_LOGIN_FAILED",
        resourceType: "USER",
        resourceId: normalized,
        correlationId: ctx.correlationId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: "INVALID_CREDENTIALS_OR_INACTIVE" },
      });

      throw new UnauthorizedError("Invalid email or password.");
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      await auditRepository.recordLog({
        actorId: user.id,
        action: "AUTH_LOGIN_FAILED",
        resourceType: "USER",
        resourceId: user.id,
        correlationId: ctx.correlationId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { reason: "PASSWORD_MISMATCH" },
      });

      throw new UnauthorizedError("Invalid email or password.");
    }

    // Update last login timestamp
    await userRepository.updateLastLogin(user.id);

    // Issue new session
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await sessionRepository.createSession({
      userId: user.id,
      sessionTokenHash: tokenHash,
      expiresAt,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    await auditRepository.recordLog({
      actorId: user.id,
      action: "AUTH_LOGIN_SUCCESS",
      resourceType: "USER",
      resourceId: user.id,
      correlationId: ctx.correlationId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      user: this.sanitizeUser(user),
      sessionToken: rawToken,
      expiresAt,
    };
  }

  /**
   * Validates a session token and returns the authenticated user.
   */
  async validateSession(rawToken: string): Promise<SanitizedUser | null> {
    if (!rawToken) return null;

    const tokenHash = hashToken(rawToken);
    const session = await sessionRepository.findActiveSession(tokenHash);

    if (!session || !session.user || session.user.status !== UserStatus.ACTIVE) {
      return null;
    }

    return this.sanitizeUser(session.user);
  }

  /**
   * Revokes the current session upon logout.
   */
  async logout(rawToken: string, ctx: RequestContext) {
    if (!rawToken) return;

    const tokenHash = hashToken(rawToken);
    await sessionRepository.revokeSession(tokenHash);

    await auditRepository.recordLog({
      actorId: null,
      action: "AUTH_LOGOUT",
      resourceType: "SESSION",
      correlationId: ctx.correlationId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });
  }

  /**
   * Initiates password reset flow with opaque response preventing email enumeration.
   */
  async requestPasswordReset(email: string, ctx: RequestContext) {
    const normalized = normalizeEmail(email);
    const user = await userRepository.findByNormalizedEmail(normalized);

    if (user && user.status === UserStatus.ACTIVE) {
      const resetToken = generateSecureToken(32);
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await auditRepository.recordLog({
        actorId: user.id,
        action: "AUTH_PASSWORD_RESET_REQUESTED",
        resourceType: "USER",
        resourceId: user.id,
        correlationId: ctx.correlationId,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      // In production, dispatch email through background queue with resetToken
    }

    // Always return constant message to prevent account enumeration
    return {
      message: "If an account with that email exists, password reset instructions have been dispatched.",
    };
  }

  /**
   * Resets password using valid unexpired token and invalidates all active sessions.
   */
  async resetPassword(input: ResetPasswordInput, ctx: RequestContext) {
    const tokenHash = hashToken(input.token);

    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord || !resetRecord.user) {
      throw new ValidationError("Invalid, used, or expired password reset token.");
    }

    const newHash = await hashPassword(input.newPassword);

    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash, updatedAt: new Date() },
      });

      // Mark token used
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });

      // Revoke all existing sessions across all devices
      await tx.session.updateMany({
        where: { userId: resetRecord.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await auditRepository.recordLog({
      actorId: resetRecord.userId,
      action: "AUTH_PASSWORD_RESET_SUCCESS",
      resourceType: "USER",
      resourceId: resetRecord.userId,
      correlationId: ctx.correlationId,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return {
      message: "Password has been updated successfully. Please sign in with your new credentials.",
    };
  }

  /**
   * Revokes active sessions for a user.
   */
  async revokeSessions(userId: string, currentRawToken?: string, all = false) {
    if (all) {
      await sessionRepository.revokeAllUserSessions(userId);
    } else if (currentRawToken) {
      await sessionRepository.revokeSession(hashToken(currentRawToken));
    }
  }
}

export const authService = new AuthService();
