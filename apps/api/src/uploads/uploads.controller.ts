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

@Controller("uploads")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("INSTRUCTOR")
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post("presign")
  presign(@CurrentUser() user: AuthUser, @Body() dto: PresignDto) {
    return this.uploads.presign({
      userId: user.id,
      filename: dto.filename,
      contentType: dto.contentType,
    });
  }
}
