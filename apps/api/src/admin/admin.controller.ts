import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsIn, IsInt, Min, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import type { CourseStatus, Role } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { AdminService, type BroadcastAudience } from "./admin.service";

const ROLES: readonly Role[] = ["STUDENT", "INSTRUCTOR", "ADMIN"];
const AUDIENCES: readonly BroadcastAudience[] = ["ALL", "STUDENT", "INSTRUCTOR"];
const NOTIF_TYPES = ["info", "welcome", "referral", "certificate"] as const;

class SetRoleDto {
  @IsIn(ROLES)
  role!: Role;
}

class BroadcastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body!: string;

  @IsOptional()
  @IsIn(NOTIF_TYPES)
  type?: string;

  @IsIn(AUDIENCES)
  audience!: BroadcastAudience;
}

class CreateAdminCourseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @MinLength(1)
  instructorId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceCents?: number;
}

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private readonly service: AdminService) {}

  @Get("stats")
  stats() {
    return this.service.stats();
  }

  @Get("users")
  users(@Query("search") search?: string, @Query("role") role?: Role) {
    return this.service.listUsers(
      search?.trim() || undefined,
      role && ROLES.includes(role) ? role : undefined,
    );
  }

  @Patch("users/:id/role")
  setRole(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: SetRoleDto,
  ) {
    return this.service.setRole(id, user.id, dto.role);
  }

  @Get("courses")
  courses() {
    return this.service.listCourses();
  }

  @Post("courses")
  createCourse(@Body() dto: CreateAdminCourseDto) {
    return this.service.createCourse(dto);
  }

  @Post("courses/:id/publish")
  publish(@Param("id") id: string) {
    return this.service.setCourseStatus(id, "PUBLISHED" satisfies CourseStatus);
  }

  @Post("courses/:id/unpublish")
  unpublish(@Param("id") id: string) {
    return this.service.setCourseStatus(id, "DRAFT" satisfies CourseStatus);
  }

  @Delete("courses/:id")
  deleteCourse(@Param("id") id: string) {
    return this.service.deleteCourse(id);
  }

  @Get("posts")
  posts() {
    return this.service.listPosts();
  }

  @Delete("posts/:id")
  deletePost(@Param("id") id: string) {
    return this.service.deletePost(id);
  }

  @Post("notifications/broadcast")
  broadcast(@Body() dto: BroadcastDto) {
    return this.service.broadcast(dto);
  }
}
