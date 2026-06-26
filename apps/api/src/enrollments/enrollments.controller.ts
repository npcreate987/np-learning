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
import { EnrollmentsService } from "./enrollments.service";

class EnrollDto {
  @IsString()
  courseId!: string;
}

@Controller("enrollments")
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post()
  enroll(@CurrentUser() user: AuthUser, @Body() dto: EnrollDto) {
    return this.enrollments.enroll(user, dto.courseId);
  }

  @Get("mine")
  mine(@CurrentUser() user: AuthUser) {
    return this.enrollments.listMine(user);
  }

  @Get("check/:courseId")
  check(@Param("courseId") courseId: string, @CurrentUser() user: AuthUser) {
    return this.enrollments.isEnrolled(user, courseId);
  }

  @Delete(":courseId")
  unenroll(@Param("courseId") courseId: string, @CurrentUser() user: AuthUser) {
    return this.enrollments.unenroll(user, courseId);
  }
}
