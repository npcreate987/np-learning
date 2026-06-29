import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";
import { CreateCourseDto, UpdateCourseDto } from "./dto";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "course";
}

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public catalog: published courses only. */
  listPublished() {
    return this.prisma.course.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: { id: true, displayName: true } },
        _count: { select: { sections: true, enrollments: true } },
      },
    });
  }

  /** Alias kept for backward-compatible routes; all courses are TikTok classes now. */
  listTiktok() {
    return this.listPublished();
  }

  /** Flat clip feed for a TikTok class (video lessons only). */
  async getTiktokFeed(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        status: true,
        coverImageUrl: true,
        instructor: { select: { id: true, displayName: true } },
        sections: {
          orderBy: { order: "asc" },
          select: {
            lessons: {
              where: { videoUrl: { not: null } },
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                caption: true,
                videoUrl: true,
                durationSeconds: true,
                type: true,
                order: true,
              },
            },
          },
        },
      },
    });
    if (!course || course.status !== "PUBLISHED") {
      throw new NotFoundException("ไม่พบคลาส");
    }

    const clips = course.sections.flatMap((s) => s.lessons).filter((l) => l.videoUrl);
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      instructor: course.instructor,
      clipCount: clips.length,
      clips,
    };
  }

  /** Courses owned by the current instructor. */
  listMine(user: AuthUser) {
    return this.prisma.course.findMany({
      where: { instructorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { sections: true, enrollments: true } },
      },
    });
  }

  async getBySlug(slug: string) {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: { select: { id: true, displayName: true } },
        sections: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
              select: { id: true, title: true, type: true, order: true },
            },
          },
        },
      },
    });
    // Public detail view: never expose draft/unpublished courses. Instructors
    // preview their own drafts via the studio editor (getForEdit, owner-checked).
    if (!course || course.status !== "PUBLISHED") {
      throw new NotFoundException("ไม่พบคอร์ส");
    }
    return course;
  }

  /** Full course tree for editing (owner only). */
  async getForEdit(id: string, user: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
    this.assertOwner(course.instructorId, user);
    return course;
  }

  async create(user: AuthUser, dto: CreateCourseDto) {
    const slug = await this.uniqueSlug(slugify(dto.title));
    return this.prisma.course.create({
      data: {
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        priceCents: dto.priceCents ?? 0,
        slug,
        instructorId: user.id,
      },
    });
  }

  async update(id: string, user: AuthUser, dto: UpdateCourseDto) {
    await this.assertOwnerById(id, user);
    return this.prisma.course.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        priceCents: dto.priceCents,
      },
    });
  }

  async setStatus(id: string, user: AuthUser, status: "DRAFT" | "PUBLISHED") {
    await this.assertOwnerById(id, user);
    return this.prisma.course.update({ where: { id }, data: { status } });
  }

  async remove(id: string, user: AuthUser) {
    await this.assertOwnerById(id, user);
    await this.prisma.course.delete({ where: { id } });
    return { ok: true };
  }

  private async uniqueSlug(base: string): Promise<string> {
    let slug = base;
    let n = 1;
    // eslint-disable-next-line no-await-in-loop
    while (await this.prisma.course.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`;
    }
    return slug;
  }

  private assertOwner(instructorId: string, user: AuthUser) {
    if (instructorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("Not the owner of this course");
    }
  }

  private async assertOwnerById(id: string, user: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: { instructorId: true },
    });
    if (!course) {
      throw new NotFoundException("Course not found");
    }
    this.assertOwner(course.instructorId, user);
  }
}
