import { Body, Controller, ForbiddenException, Post } from "@nestjs/common";
import { IsIn } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { isDevAuthEnabled, signDevJwt } from "./dev-token";

type DemoRole = "STUDENT" | "INSTRUCTOR" | "ADMIN";

const DEMO_USERS: Record<
  DemoRole,
  { id: string; email: string; displayName: string }
> = {
  STUDENT: { id: "demo-student", email: "student@demo.local", displayName: "นักเรียนเดโม" },
  INSTRUCTOR: {
    id: "demo-instructor",
    email: "instructor@example.com",
    displayName: "ครูเดโม",
  },
  ADMIN: { id: "demo-admin", email: "admin@demo.local", displayName: "แอดมินเดโม" },
};

class DevLoginDto {
  @IsIn(["STUDENT", "INSTRUCTOR", "ADMIN"])
  role!: DemoRole;
}

@Controller("auth")
export class DevAuthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Issues a demo session token without Supabase. Enabled only when DEV_AUTH=true. */
  @Post("dev-login")
  async devLogin(@Body() dto: DevLoginDto) {
    if (!isDevAuthEnabled()) {
      throw new ForbiddenException("Dev auth is disabled");
    }
    const demo = DEMO_USERS[dto.role];
    const profile = await this.prisma.profile.upsert({
      where: { id: demo.id },
      update: { role: dto.role, displayName: demo.displayName },
      create: {
        id: demo.id,
        email: demo.email,
        displayName: demo.displayName,
        role: dto.role,
      },
    });

    const token = signDevJwt({
      sub: profile.id,
      email: profile.email,
      user_metadata: { display_name: profile.displayName },
    });

    return {
      access_token: token,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        displayName: profile.displayName,
      },
    };
  }
}
