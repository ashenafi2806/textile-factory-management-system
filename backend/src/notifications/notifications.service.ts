import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private get client() {
    return this.prisma as any;
  }

  async createForUsers(userIds: string[], payload: { title: string; message: string; type: string; urgent?: boolean }) {
    if (userIds.length === 0) return [];
    return this.client.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        urgent: payload.urgent ?? false,
      })),
    });
  }

  async unreadForUser(userId: string) {
    return this.client.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.client.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.client.notification.update({ where: { id }, data: { read: true } });
  }
}
