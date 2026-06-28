import { BadRequestException, Injectable } from "@nestjs/common";
import type { CourseStatus, Prisma, Role } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

const ROLES: readonly Role[] = ["STUDENT", "INSTRUCTOR", "ADMIN"];
const COURSE_STATUSES: readonly CourseStatus[] = ["DRAFT", "PUBLISHED"];
const LEAD_STATUSES = ["PENDING", "CONTACTED", "ENROLLED", "CANCELLED"] as const;

export type BroadcastAudience = "ALL" | "STUDENT" | "INSTRUCTOR";

export interface BroadcastInput {
  title: string;
  body: string;
  type?: string;
  audience: BroadcastAudience;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Platform-wide counts + recent activity for the admin dashboard. */
  async stats() {
    const [
      usersByRole,
      coursesByStatus,
      enrollments,
      certificates,
      leadsByStatus,
      recentLeads,
      recentEnrollments,
    ] = await Promise.all([
      this.prisma.profile.groupBy({ by: ["role"], _count: { _all: true } }),
      this.prisma.course.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.enrollment.count(),
      this.prisma.certificate.count(),
      this.prisma.learningInterest.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.learningInterest.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { course: { select: { title: true } } },
      }),
      this.prisma.enrollment.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true, displayName: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    const roleCount = (r: Role) =>
      usersByRole.find((g) => g.role === r)?._count._all ?? 0;
    const courseStatusCount = (s: CourseStatus) =>
      coursesByStatus.find((g) => g.status === s)?._count._all ?? 0;
    const leadStatusCount = (s: (typeof LEAD_STATUSES)[number]) =>
      leadsByStatus.find((g) => g.status === s)?._count._all ?? 0;

    const students = roleCount("STUDENT");
    const instructors = roleCount("INSTRUCTOR");
    const admins = roleCount("ADMIN");
    const published = courseStatusCount("PUBLISHED");
    const draft = courseStatusCount("DRAFT");

    return {
      users: {
        total: students + instructors + admins,
        students,
        instructors,
        admins,
      },
      courses: { total: published + draft, published, draft },
      enrollments,
      certificates,
      leads: {
        total:
          leadStatusCount("PENDING") +
          leadStatusCount("CONTACTED") +
          leadStatusCount("ENROLLED") +
          leadStatusCount("CANCELLED"),
        pending: leadStatusCount("PENDING"),
        contacted: leadStatusCount("CONTACTED"),
        enrolled: leadStatusCount("ENROLLED"),
        cancelled: leadStatusCount("CANCELLED"),
      },
      recentLeads,
      recentEnrollments,
    };
  }

  listUsers(search?: string, role?: Role) {
    const where: Prisma.ProfileWhereInput = {};
    if (role && ROLES.includes(role)) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
      ];
    }
    return this.prisma.profile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
      _count: { select: { enrollments: true, referrals: true } },
      },
    });
  }

  /** Change a user's role. The caller cannot change their own role to avoid
   * accidentally locking themselves out of the admin panel. */
  setRole(targetId: string, callerId: string, role: Role) {
    if (targetId === callerId) {
      throw new BadRequestException("ไม่สามารถเปลี่ยน role ของตัวเองได้");
    }
    return this.prisma.profile.update({
      where: { id: targetId },
      data: { role },
    });
  }

  listCourses() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: { id: true, displayName: true, email: true } },
        _count: { select: { sections: true, enrollments: true } },
      },
    });
  }

  setCourseStatus(id: string, status: CourseStatus) {
    return this.prisma.course.update({ where: { id }, data: { status } });
  }

  async deleteCourse(id: string) {
    await this.prisma.course.delete({ where: { id } });
    return { ok: true };
  }

  listPosts() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: { id: true, displayName: true, email: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });
  }

  async deletePost(id: string) {
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }

  async broadcast(input: BroadcastInput) {
    const where: Prisma.ProfileWhereInput =
      input.audience === "ALL" ? {} : { role: input.audience };
    const users = await this.prisma.profile.findMany({
      where,
      select: { id: true },
    });
    if (users.length === 0) return { sent: 0 };
    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: input.type ?? "info",
        title: input.title,
        body: input.body,
      })),
    });
    return { sent: users.length };
  }
}
