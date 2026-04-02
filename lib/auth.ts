// lib/auth.ts
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    return null;
  }
}

export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy = {
    [UserRole.USER]: 0,
    [UserRole.ADMIN]: 1,
    [UserRole.SUPER_ADMIN]: 2,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
