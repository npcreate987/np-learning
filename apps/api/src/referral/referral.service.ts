import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

// Avoid ambiguous characters (0/O, 1/I) so codes are easy to share verbally.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_GENERATE_TRIES = 8;

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ensure the user has a referral code, generating one on first use. */
  async ensureCode(user: AuthUser): Promise<string> {
    const profile = await this.prisma.profile.findUniqueOrThrow({
      where: { id: user.id },
      select: { referralCode: true },
    });
    if (profile.referralCode) return profile.referralCode;

    for (let attempt = 0; attempt < MAX_GENERATE_TRIES; attempt++) {
      const code = randomCode();
      try {
        const updated = await this.prisma.profile.update({
          where: { id: user.id },
          data: { referralCode: code },
          select: { referralCode: true },
        });
        return updated.referralCode!;
      } catch {
        // Unique collision (extremely rare for 6 chars from 32) — try again.
      }
    }
    throw new Error("Unable to generate a unique referral code");
  }

  async getMe(user: AuthUser) {
    const referralCode = await this.ensureCode(user);

    const [referredBy, referrals, enrolledCount] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { id: user.id },
        select: {
          referredBy: { select: { referralCode: true, displayName: true } },
        },
      }),
      this.prisma.profile.findMany({
        where: { referredById: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, displayName: true, email: true, createdAt: true },
      }),
      this.prisma.profile.count({ where: { referredById: user.id } }),
    ]);

    // How many of the referred users actually enrolled in at least one class.
    const referredIds = referrals.map((r) => r.id);
    const enrolled = referredIds.length === 0
      ? 0
      : await this.prisma.enrollment.groupBy({
          by: ["userId"],
          where: { userId: { in: referredIds } },
          _count: { _all: true },
        }).then((rows) => rows.length);

    return {
      referralCode,
      referredBy: referredBy?.referredBy ?? null,
      stats: {
        referrals: enrolledCount,
        enrolled,
      },
      recentReferrals: referrals,
    };
  }

  async applyCode(user: AuthUser, code: string) {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      throw new BadRequestException("กรุณาระบุรหัสแนะนำ");
    }

    const me = await this.prisma.profile.findUniqueOrThrow({
      where: { id: user.id },
      select: { id: true, referredById: true },
    });
    if (me.referredById) {
      throw new BadRequestException("คุณถูกแนะนำโดยบัญชีอื่นแล้ว");
    }

    const referrer = await this.prisma.profile.findUnique({
      where: { referralCode: normalized },
      select: { id: true, displayName: true },
    });
    if (!referrer) {
      throw new NotFoundException("รหัสแนะนำไม่ถูกต้อง");
    }
    if (referrer.id === user.id) {
      throw new BadRequestException("ไม่สามารถใช้รหัสของตัวเองได้");
    }

    await this.prisma.profile.update({
      where: { id: user.id },
      data: { referredById: referrer.id },
    });

    // Notify the referrer so they can see their network growing.
    await this.prisma.notification
      .create({
        data: {
          userId: referrer.id,
          type: "referral",
          title: "มีคนสมัครจากลิงก์ของคุณ",
          body: `${referrer.displayName ?? "เพื่อนใหม่"} สมัครสมาชิกผ่านลิงก์แนะนำของคุณแล้ว`,
          payload: { referredId: user.id },
        },
      })
      .catch(() => null);

    return { ok: true };
  }
}
