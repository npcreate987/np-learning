import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async markComplete(user: AuthUser, lessonId: string) {
    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { completedAt: new Date() },
      create: { userId: user.id, lessonId },
    });
  }

  async markIncomplete(user: AuthUser, lessonId: string) {
    await this.prisma.lessonProgress
      .delete({ where: { userId_lessonId: { userId: user.id, lessonId } } })
      .catch(() => null);
    return { ok: true };
  }

  async courseProgress(user: AuthUser, courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { section: { courseId } },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    const completed = await this.prisma.lessonProgress.findMany({
      where: { userId: user.id, lessonId: { in: lessonIds } },
      select: { lessonId: true },
    });
    const completedLessonIds = completed.map((c) => c.lessonId);

    return {
      courseId,
      totalLessons: lessonIds.length,
      completedLessons: completedLessonIds.length,
      completedLessonIds,
    };
  }
}
