import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async enroll(user: AuthUser, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true },
    });
    if (!course || course.status !== "PUBLISHED") {
      throw new NotFoundException("Course not available");
    }
    return this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      update: {},
      create: { userId: user.id, courseId },
    });
  }

  async unenroll(user: AuthUser, courseId: string) {
    await this.prisma.enrollment
      .delete({ where: { userId_courseId: { userId: user.id, courseId } } })
      .catch(() => null);
    return { ok: true };
  }

  listMine(user: AuthUser) {
    return this.prisma.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          include: {
            instructor: { select: { id: true, displayName: true } },
            _count: { select: { sections: true } },
          },
        },
      },
    });
  }

  /**
   * Powers the post-login dashboard: enrolled courses with per-course
   * progress, plus roll-up stats (completed / in-progress / certificates).
   */
  async summary(user: AuthUser) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            coverImageUrl: true,
            instructor: { select: { id: true, displayName: true } },
          },
        },
      },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const lessons =
      courseIds.length === 0
        ? []
        : await this.prisma.lesson.findMany({
            where: { section: { courseId: { in: courseIds } } },
            select: { id: true, order: true, section: { select: { courseId: true } } },
            orderBy: [{ section: { order: "asc" } }, { order: "asc" }],
          });

    const totalByCourse = new Map<string, number>();
    const firstLessonByCourse = new Map<string, string>();
    for (const l of lessons) {
      const cid = l.section.courseId;
      totalByCourse.set(cid, (totalByCourse.get(cid) ?? 0) + 1);
      if (!firstLessonByCourse.has(cid)) firstLessonByCourse.set(cid, l.id);
    }

    const completed =
      lessons.length === 0
        ? []
        : await this.prisma.lessonProgress.findMany({
            where: { userId: user.id, lessonId: { in: lessons.map((l) => l.id) } },
            select: { lessonId: true },
          });
    const lessonToCourse = new Map(lessons.map((l) => [l.id, l.section.courseId]));
    const completedByCourse = new Map<string, number>();
    for (const c of completed) {
      const cid = lessonToCourse.get(c.lessonId);
      if (!cid) continue;
      completedByCourse.set(cid, (completedByCourse.get(cid) ?? 0) + 1);
    }

    const certificates = await this.prisma.certificate.count({
      where: { userId: user.id },
    });

    const items = enrollments.map((e) => {
      const total = totalByCourse.get(e.courseId) ?? 0;
      const done = completedByCourse.get(e.courseId) ?? 0;
      const percent = total === 0 ? 0 : Math.round((done / total) * 100);
      return {
        id: e.id,
        courseId: e.courseId,
        course: e.course,
        totalLessons: total,
        completedLessons: done,
        percent,
        nextLessonId: total > 0 ? (firstLessonByCourse.get(e.courseId) ?? null) : null,
        createdAt: e.createdAt,
      };
    });

    return {
      enrollments: items,
      stats: {
        enrolled: items.length,
        completed: items.filter((i) => i.totalLessons > 0 && i.percent === 100).length,
        inProgress: items.filter((i) => i.percent < 100).length,
        certificates,
      },
    };
  }

  async isEnrolled(user: AuthUser, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    return { enrolled: Boolean(enrollment) };
  }
}
