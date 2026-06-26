import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";

const authorSelect = { id: true, displayName: true } as const;

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async listPosts(userId: string | null) {
    const posts = await this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: authorSelect },
        _count: { select: { comments: true, likes: true } },
      },
    });

    let likedIds = new Set<string>();
    if (userId && posts.length) {
      const likes = await this.prisma.postLike.findMany({
        where: { profileId: userId, postId: { in: posts.map((p) => p.id) } },
        select: { postId: true },
      });
      likedIds = new Set(likes.map((l) => l.postId));
    }

    return posts.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      author: p.author,
      commentCount: p._count.comments,
      likeCount: p._count.likes,
      liked: likedIds.has(p.id),
    }));
  }

  createPost(user: AuthUser, content: string) {
    return this.prisma.post.create({
      data: { authorId: user.id, content: content.trim() },
      include: {
        author: { select: authorSelect },
        _count: { select: { comments: true, likes: true } },
      },
    });
  }

  async deletePost(user: AuthUser, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException("ไม่พบโพสต์");
    if (post.authorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("ลบได้เฉพาะเจ้าของโพสต์");
    }
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }

  async toggleLike(user: AuthUser, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException("ไม่พบโพสต์");

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_profileId: { postId, profileId: user.id } },
    });
    if (existing) {
      await this.prisma.postLike.delete({
        where: { postId_profileId: { postId, profileId: user.id } },
      });
    } else {
      await this.prisma.postLike.create({
        data: { postId, profileId: user.id },
      });
    }
    const likeCount = await this.prisma.postLike.count({ where: { postId } });
    return { liked: !existing, likeCount };
  }

  async listComments(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: authorSelect } },
    });
  }

  async addComment(user: AuthUser, postId: string, content: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) throw new NotFoundException("ไม่พบโพสต์");
    return this.prisma.comment.create({
      data: { postId, authorId: user.id, content: content.trim() },
      include: { author: { select: authorSelect } },
    });
  }
}
