import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import type { InterestStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { LearningInterestService } from "./learning-interest.service";

const STATUSES = ["PENDING", "CONTACTED", "ENROLLED", "CANCELLED"] as const;

class CreateInterestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  fullName!: string;

  // Thai mobile/landline: 9-10 digits starting with 0 (after stripping
  // spaces/dashes on the client and again on the server).
  @Matches(/^0\d{1,2}[-\s]?\d{3}[-\s]?\d{3,4}$/, {
    message: "เบอร์โทรไม่ถูกต้อง",
  })
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class UpdateStatusDto {
  @IsIn(STATUSES)
  status!: InterestStatus;
}

@Controller("learning-interest")
export class LearningInterestController {
  constructor(private readonly service: LearningInterestService) {}

  /** Public-ish: a logged-in user gets linked, guests can still submit. */
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@CurrentUser() user: AuthUser | null, @Body() dto: CreateInterestDto) {
    return this.service.create(user?.id ?? null, dto);
  }

  /** Admin/instructor only: list submitted leads. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR", "ADMIN")
  list(@Query("status") status?: InterestStatus) {
    return this.service.list(STATUSES.includes(status as never) ? status : undefined);
  }

  /** Admin/instructor only: move a lead through the pipeline. */
  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR", "ADMIN")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
