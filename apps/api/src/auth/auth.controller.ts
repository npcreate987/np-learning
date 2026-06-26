import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { PrismaService } from "../prisma/prisma.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import type { AuthUser } from "./jwt.strategy";

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  // Allow a user to opt-in to becoming an instructor in this MVP.
  @IsOptional()
  @IsIn(["STUDENT", "INSTRUCTOR"])
  role?: "STUDENT" | "INSTRUCTOR";
}

@Controller("auth")
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async me(@CurrentUser() user: AuthUser) {
    return this.prisma.profile.findUniqueOrThrow({ where: { id: user.id } });
  }

  @Patch("me")
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.prisma.profile.update({
      where: { id: user.id },
      data: {
        displayName: dto.displayName,
        role: dto.role,
      },
    });
  }
}
