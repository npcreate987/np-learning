import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: AuthUser,
    data: { courseId: string; title: string; order?: number },
  ) {
    await this.assertCourseOwner(data.courseId, user);
    const order = data.order ?? (await this.nextOrder(data.courseId));
    return this.prisma.section.create({
      data: { courseId: data.courseId, title: data.title, order },
    });
  }

  async update(
    id: string,
    user: AuthUser,
    data: { title?: string; order?: number },
  ) {
    await this.assertSectionOwner(id, user);
    return this.prisma.section.update({ where: { id }, data });
  }

  async remove(id: string, user: AuthUser) {
    await this.assertSectionOwner(id, user);
    await this.prisma.section.delete({ where: { id } });
    return { ok: true };
  }

  private async nextOrder(courseId: string): Promise<number> {
    const last = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  private async assertCourseOwner(courseId: string, user: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Not the owner of this course");
    }
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
}
