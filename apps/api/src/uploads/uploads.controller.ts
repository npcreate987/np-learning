import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IsString, Matches, MaxLength, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { UploadsService } from "./uploads.service";

class PresignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @IsString()
  @Matches(/^[\w.+-]+\/[\w.+-]+$/, { message: "Invalid content type" })
  contentType!: string;
}

class AvatarPresignDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  // Avatars are public profile images — restrict to image/* so a user can't
  // turn the avatar endpoint into arbitrary file storage.
  @IsString()
  @Matches(/^image\/(png|jpe?g|webp|gif)$/i, {
    message: "Avatar ต้องเป็นไฟล์รูป (png, jpg, webp, gif) เท่านั้น",
  })
  contentType!: string;
}

@Controller("uploads")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  // Course assets are instructor-only.
  @Post("presign")
  @Roles("INSTRUCTOR")
  presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDto) {
    return this.uploads.presign({
      userId: user.id,
      filename: dto.filename,
      contentType: dto.contentType,
    });
  }

  // Any authenticated user can upload their own avatar (image-only).
  @Post("avatar-presign")
  avatarPresign(@CurrentUser() user: AuthUser, @Body() dto: AvatarPresignDto) {
    return this.uploads.avatarPresign({
      userId: user.id,
      filename: dto.filename,
      contentType: dto.contentType,
    });
  }
}
