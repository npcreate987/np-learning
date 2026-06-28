import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { ReferralService } from "./referral.service";

class ApplyReferralDto {
  @IsString()
  @MinLength(4)
  code!: string;
}

@Controller("referral")
@UseGuards(JwtAuthGuard)
export class ReferralController {
  constructor(private readonly service: ReferralService) {}

  /** Get (or lazily create) my referral code plus affiliate stats. */
  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.service.getMe(user);
  }

  /** Link the current user to the referrer behind a code (once only). */
  @Post("apply")
  apply(@CurrentUser() user: AuthUser, @Body() dto: ApplyReferralDto) {
    return this.service.applyCode(user, dto.code);
  }
}
