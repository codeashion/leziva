import { prisma } from "@/server/db/prisma";

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
    return prisma.session.findFirst({
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
  }

  async revokeSession(sessionTokenHash: string) {
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
