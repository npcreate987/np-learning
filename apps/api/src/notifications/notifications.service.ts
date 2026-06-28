import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  list(user: AuthUser, take = 50) {
    return this.prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: Math.min(50, Math.max(1, take)),
    });
  }

  async unreadCount(user: AuthUser) {
    const count = await this.prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return { count };
  }

  async markRead(user: AuthUser, id: string) {
    // Ownership check: only update a notification that belongs to the caller.
    const owned = await this.prisma.notification.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      throw new NotFoundException("Notification not found");
    }
    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  markAllRead(user: AuthUser) {
    return this.prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
  }
}
