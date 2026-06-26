import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { LessonType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: AuthUser,
    data: { sectionId: string; title: string; type?: LessonType; order?: number },
  ) {
    await this.assertSectionOwner(data.sectionId, user);
    const order = data.order ?? (await this.nextOrder(data.sectionId));
    return this.prisma.lesson.create({
      data: {
        sectionId: data.sectionId,
        title: data.title,
        type: data.type ?? "TEXT",
        order,
      },
    });
  }

  async update(
    id: string,
    user: AuthUser,
    data: {
      title?: string;
      contentJson?: Prisma.InputJsonValue;
      type?: LessonType;
      order?: number;
      videoUrl?: string;
      caption?: string;
      durationSeconds?: number;
      attachments?: Prisma.InputJsonValue;
    },
  ) {
    await this.assertLessonOwner(id, user);
    return this.prisma.lesson.update({ where: { id }, data });
  }

  async remove(id: string, user: AuthUser) {
    await this.assertLessonOwner(id, user);
    await this.prisma.lesson.delete({ where: { id } });
    return { ok: true };
  }

  /** Returns full lesson content. Requires enrollment, ownership, or admin. */
  async getForLearning(id: string, user: AuthUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        section: {
          select: {
            courseId: true,
            course: { select: { instructorId: true } },
          },
        },
      },
    });
    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }

    const isOwner =
      lesson.section.course.instructorId === user.id || user.role === "ADMIN";

    if (!isOwner) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId: user.id, courseId: lesson.section.courseId },
        },
      });
      if (!enrollment) {
        throw new ForbiddenException("Enroll in this course to view the lesson");
      }
    }

    const { section, ...rest } = lesson;
    return { ...rest, courseId: section.courseId };
  }

  private async nextOrder(sectionId: string): Promise<number> {
    const last = await this.prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  private async assertSectionOwner(sectionId: string, user: AuthUser) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
      select: { course: { select: { instructorId: true } } },
    });
    if (!section) {
      throw new NotFoundException("Section not found");
    }
    if (section.course.instructorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Not the owner of this course");
    }
  }

  private async assertLessonOwner(lessonId: string, user: AuthUser) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { section: { select: { course: { select: { instructorId: true } } } } },
    });
    if (!lesson) {
      throw new NotFoundException("Lesson not found");
    }
    if (lesson.section.course.instructorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Not the owner of this course");
    }
  }
}
