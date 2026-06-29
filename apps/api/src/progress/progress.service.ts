import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve the course a lesson belongs to, throwing if the lesson is missing. */
  private async lessonCourseId(lessonId: string): Promise<string> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, section: { select: { courseId: true } } },
    });
    if (!lesson) {
      throw new NotFoundException("ไม่พบบทเรียน");
    }
    return lesson.section.courseId;
  }

  /**
   * Students may only track progress for courses they're enrolled in.
   * Instructors track their own courses; admins bypass. Prevents the
   * mark-complete / course-progress IDOR.
   */
  private async assertCanTrack(user: AuthUser, courseId: string) {
    if (user.role === "ADMIN") return;
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (course && course.instructorId === user.id) return;
    const enrolled = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      select: { id: true },
    });
    if (!enrolled) {
      throw new ForbiddenException("คุณยังไม่ได้ลงทะเบียนคอร์สนี้");
    }
  }

  async markComplete(user: AuthUser, lessonId: string) {
    const courseId = await this.lessonCourseId(lessonId);
    await this.assertCanTrack(user, courseId);
    return this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      update: { completedAt: new Date() },
      create: { userId: user.id, lessonId },
    });
  }

  async markIncomplete(user: AuthUser, lessonId: string) {
    // Scoped to the caller's own row — a user can only clear their own progress.
    await this.prisma.lessonProgress
      .delete({ where: { userId_lessonId: { userId: user.id, lessonId } } })
      .catch(() => null);
    return { ok: true };
  }

  async courseProgress(user: AuthUser, courseId: string) {
    await this.assertCanTrack(user, courseId);
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
