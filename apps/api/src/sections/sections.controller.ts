import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  IsInt,
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
import { SectionsService } from "./sections.service";

class CreateSectionDto {
  @IsString()
  courseId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

class UpdateSectionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

@Controller("sections")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("INSTRUCTOR")
export class SectionsController {
  constructor(private readonly sections: SectionsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSectionDto) {
    return this.sections.create(user, dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sections.update(id, user, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.sections.remove(id, user);
  }
}
