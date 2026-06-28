import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

export interface RegisterDeviceInput {
  platform: "IOS" | "ANDROID" | "WEB";
  token: string;
}

@Injectable()
export class DeviceTokensService {
  constructor(private readonly prisma: PrismaService) {}

  register(user: AuthUser, input: RegisterDeviceInput) {
    return this.prisma.deviceToken.upsert({
      where: {
        userId_platform_token: {
          userId: user.id,
          platform: input.platform,
          token: input.token,
        },
      },
      update: { updatedAt: new Date() },
      create: {
        userId: user.id,
        platform: input.platform,
        token: input.token,
      },
    });
  }

  async remove(user: AuthUser, id: string) {
    const owned = await this.prisma.deviceToken.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!owned) {
      throw new NotFoundException("Device token not found");
    }
    await this.prisma.deviceToken.delete({ where: { id } });
    return { ok: true };
  }
}
