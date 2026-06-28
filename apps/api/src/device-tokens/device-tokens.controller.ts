import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsIn, IsString, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { DeviceTokensService } from "./device-tokens.service";

const PLATFORMS = ["IOS", "ANDROID", "WEB"] as const;

class RegisterDeviceDto {
  @IsIn(PLATFORMS)
  platform!: (typeof PLATFORMS)[number];

  @IsString()
  @MinLength(1)
  token!: string;
}

@Controller("device-tokens")
@UseGuards(JwtAuthGuard)
export class DeviceTokensController {
  constructor(private readonly service: DeviceTokensService) {}

  @Post()
  register(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto) {
    return this.service.register(user, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(user, id);
  }
}
