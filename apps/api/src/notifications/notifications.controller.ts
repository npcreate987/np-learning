import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query("take") take?: string) {
    const n = take ? Number.parseInt(take, 10) : undefined;
    return this.service.list(user, Number.isFinite(n) ? n : undefined);
  }

  @Get("unread-count")
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.service.unreadCount(user);
  }

  @Post("read-all")
  async readAll(@CurrentUser() user: AuthUser) {
    await this.service.markAllRead(user);
    return { ok: true };
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.markRead(user, id);
  }
}
