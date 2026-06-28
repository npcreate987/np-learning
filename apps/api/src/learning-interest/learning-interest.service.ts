import { Injectable } from "@nestjs/common";
import type { InterestStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface CreateInterestInput {
  fullName: string;
  phone: string;
  address?: string;
  courseId?: string;
  note?: string;
}

@Injectable()
export class LearningInterestService {
  constructor(private readonly prisma: PrismaService) {}

  /** Normalize a Thai phone number: strip spaces, dashes and parentheses. */
  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-()]/g, "");
  }

  create(userId: string | null, input: CreateInterestInput) {
    return this.prisma.learningInterest.create({
      data: {
        userId: userId ?? undefined,
        courseId: input.courseId ?? undefined,
        fullName: input.fullName.trim(),
        phone: this.normalizePhone(input.phone),
        address: input.address?.trim() || undefined,
        note: input.note?.trim() || undefined,
      },
    });
  }

  list(status?: InterestStatus) {
    const where: Prisma.LearningInterestWhereInput = status ? { status } : {};
    return this.prisma.learningInterest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        user: { select: { id: true, displayName: true, email: true } },
      },
    });
  }

  updateStatus(id: string, status: InterestStatus) {
    return this.prisma.learningInterest.update({
      where: { id },
      data: { status },
    });
  }
}
