import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IsString, MaxLength, MinLength } from "class-validator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { CommunityService } from "./community.service";

class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;
}

class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

@Controller("community")
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get("posts")
  @UseGuards(OptionalJwtAuthGuard)
  listPosts(@CurrentUser() user: AuthUser | null) {
    return this.community.listPosts(user?.id ?? null);
  }

  @Post("posts")
  @UseGuards(JwtAuthGuard)
  createPost(@CurrentUser() user: AuthUser, @Body() dto: CreatePostDto) {
    return this.community.createPost(user, dto.content);
  }

  @Delete("posts/:id")
  @UseGuards(JwtAuthGuard)
  deletePost(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.community.deletePost(user, id);
  }

  @Post("posts/:id/like")
  @UseGuards(JwtAuthGuard)
  toggleLike(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.community.toggleLike(user, id);
  }

  @Get("posts/:id/comments")
  listComments(@Param("id") id: string) {
    return this.community.listComments(id);
  }

  @Post("posts/:id/comments")
  @UseGuards(JwtAuthGuard)
  addComment(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.community.addComment(user, id, dto.content);
  }
}
