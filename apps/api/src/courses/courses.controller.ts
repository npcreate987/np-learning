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
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { CoursesService } from "./courses.service";
import { CreateCourseDto, UpdateCourseDto } from "./dto";

@Controller("courses")
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  // ---- public ----
  @Get()
  list() {
    return this.courses.listPublished();
  }

  @Get("tiktok")
  listTiktok() {
    return this.courses.listTiktok();
  }

  @Get("slug/:slug/tiktok-feed")
  getTiktokFeed(@Param("slug") slug: string) {
    return this.courses.getTiktokFeed(slug);
  }

  @Get("slug/:slug")
  getBySlug(@Param("slug") slug: string) {
    return this.courses.getBySlug(slug);
  }

  // ---- instructor ----
  @Get("mine")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  listMine(@CurrentUser() user: AuthUser) {
    return this.courses.listMine(user);
  }

  @Get(":id/edit")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  getForEdit(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.courses.getForEdit(id, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCourseDto) {
    return this.courses.create(user, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courses.update(id, user, dto);
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  publish(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.courses.setStatus(id, user, "PUBLISHED");
  }

  @Post(":id/unpublish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  unpublish(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.courses.setStatus(id, user, "DRAFT");
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.courses.remove(id, user);
  }
}
