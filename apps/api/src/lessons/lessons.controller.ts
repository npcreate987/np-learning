import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { LessonsService } from "./lessons.service";

class CreateLessonDto {
  @IsString()
  sectionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsIn(["TEXT", "VIDEO"])
  type?: "TEXT" | "VIDEO";

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

class UpdateLessonDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsObject()
  contentJson?: Record<string, unknown>;

  @IsOptional()
  @IsIn(["TEXT", "VIDEO"])
  type?: "TEXT" | "VIDEO";

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  videoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsArray()
  attachments?: unknown[];
}

@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  get(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.lessons.getForLearning(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLessonDto) {
    return this.lessons.create(user, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessons.update(id, user, {
      title: dto.title,
      contentJson: dto.contentJson as any,
      type: dto.type,
      order: dto.order,
      videoUrl: dto.videoUrl,
      caption: dto.caption,
      durationSeconds: dto.durationSeconds,
      attachments: dto.attachments as any,
    });
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.lessons.remove(id, user);
  }
}
