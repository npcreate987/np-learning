import { Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CertificateService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotently issues a certificate for a (user, course) pair. */
  async issue(userId: string, courseId: string) {
    const existing = await this.prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) return existing;

    const serial = `NPL-${randomBytes(4).toString("hex").toUpperCase()}`;
    return this.prisma.certificate.create({
      data: { userId, courseId, serial },
    });
  }

  listMine(userId: string) {
    return this.prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      include: { course: { select: { id: true, slug: true, title: true } } },
    });
  }

  async getBySerial(serial: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { serial },
      include: {
        course: { select: { title: true } },
        user: { select: { displayName: true } },
      },
    });
    if (!cert) throw new NotFoundException("ไม่พบใบประกาศนียบัตร");
    return {
      serial: cert.serial,
      issuedAt: cert.issuedAt,
      courseTitle: cert.course.title,
      recipientName: cert.user.displayName ?? "ผู้เรียน",
    };
  }
}
