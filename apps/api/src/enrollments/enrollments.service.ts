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

  async isEnrolled(user: AuthUser, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    return { enrolled: Boolean(enrollment) };
  }
}
