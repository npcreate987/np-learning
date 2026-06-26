import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsString } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { ProgressService } from "./progress.service";

class CompleteDto {
  @IsString()
  lessonId!: string;
}

@Controller("progress")
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Post("complete")
  complete(@CurrentUser() user: AuthUser, @Body() dto: CompleteDto) {
    return this.progress.markComplete(user, dto.lessonId);
  }

  @Delete("complete/:lessonId")
  incomplete(@Param("lessonId") lessonId: string, @CurrentUser() user: AuthUser) {
    return this.progress.markIncomplete(user, lessonId);
  }

  @Get("course/:courseId")
  course(@Param("courseId") courseId: string, @CurrentUser() user: AuthUser) {
    return this.progress.courseProgress(user, courseId);
  }
}
