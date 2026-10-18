import { prisma } from "@/server/db/prisma";
import { redisService } from "@/server/redis/client";

const SESSION_CACHE_NS = "session";
const SESSION_CACHE_TTL = 300; // 5 minutes

export class SessionRepository {
  async createSession(data: {
    userId: string;
    sessionTokenHash: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.session.create({
      data: {
        userId: data.userId,
        sessionToken: data.sessionTokenHash,
        expiresAt: data.expiresAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  async findActiveSession(sessionTokenHash: string) {
    // 1. Check hot cache
    const cached = await redisService.getJson<any>(SESSION_CACHE_NS, sessionTokenHash);
    if (cached) {
      if (new Date(cached.expiresAt) > new Date() && !cached.revokedAt) {
        return cached;
      }
    }

    // 2. Query database
    const session = await prisma.session.findFirst({
      where: {
        sessionToken: sessionTokenHash,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            userRoles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (session) {
      await redisService.setWithTtl(SESSION_CACHE_NS, sessionTokenHash, session, SESSION_CACHE_TTL);
    }

    return session;
  }

  async revokeSession(sessionTokenHash: string) {
    await redisService.deleteKey(SESSION_CACHE_NS, sessionTokenHash);
    return prisma.session.updateMany({
      where: {
        sessionToken: sessionTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllUserSessions(userId: string) {
    return prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export const sessionRepository = new SessionRepository();
