import { prisma } from "@/server/db/prisma";
import { RoleType, UserStatus } from "@prisma/client";

export class UserRepository {
  async findByNormalizedEmail(normalizedEmail: string) {
    return prisma.user.findUnique({
      where: { normalizedEmail },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async findBySupabaseUid(supabaseUid: string) {
    return prisma.user.findUnique({
      where: { supabaseUid },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async updateSupabaseUid(userId: string, supabaseUid: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { supabaseUid },
    });
  }

  async createUser(data: {
    email: string;
    normalizedEmail: string;
    passwordHash?: string;
    name?: string;
    status?: UserStatus;
    initialRole?: RoleType;
    supabaseUid?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Find or create default role
      let role = await tx.role.findUnique({
        where: { name: data.initialRole || RoleType.CUSTOMER },
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            name: data.initialRole || RoleType.CUSTOMER,
            description: `Default ${data.initialRole || RoleType.CUSTOMER} role`,
            permissions: data.initialRole === RoleType.SUPER_ADMIN ? ["*"] : ["customer:read", "customer:write"],
          },
        });
      }

      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          normalizedEmail: data.normalizedEmail,
          passwordHash: data.passwordHash,
          name: data.name,
          status: data.status || UserStatus.ACTIVE,
          supabaseUid: data.supabaseUid,
        },
      });

      // Link UserRole
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
    });
  }

  async updatePassword(userId: string, newPasswordHash: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });
  }

  async updateLastLogin(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  async assignRole(userId: string, roleName: RoleType, assignedBy?: string) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role`,
        permissions: roleName === RoleType.SUPER_ADMIN ? ["*"] : [],
      },
    });

    return prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: role.id,
        assignedBy,
      },
    });
  }
}

export const userRepository = new UserRepository();
