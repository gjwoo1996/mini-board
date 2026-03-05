import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const MAX_DEPTH = 5;

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepo: Repository<Comment>,
  ) {}

  async findByPost(postId: number) {
    const comments = await this.commentRepo.find({
      where: { postId },
      relations: ['author', 'replies'],
      order: { createdAt: 'ASC' },
    });
    return this.buildTree(comments, null);
  }

  private buildTree(comments: Comment[], parentId: number | null): any[] {
    return comments
      .filter((c) => c.parentId === parentId)
      .map((c) => ({
        ...c,
        replies: this.buildTree(comments, c.id),
      }));
  }

  async create(postId: number, dto: CreateCommentDto, author: User) {
    let depth = 0;
    if (dto.parentId) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parentId, postId },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
      if (parent.depth >= MAX_DEPTH - 1) {
        throw new BadRequestException('Max reply depth exceeded');
      }
      depth = parent.depth + 1;
    }
    return this.commentRepo.save({
      postId,
      parentId: dto.parentId ?? null,
      authorId: author.id,
      content: dto.content,
      depth,
    });
  }

  async update(id: number, dto: UpdateCommentDto, user: User) {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('Not your comment');
    }
    await this.commentRepo.update(id, { content: dto.content, isModified: true });
    return this.commentRepo.findOne({ where: { id }, relations: ['author'] });
  }

  async remove(id: number, user: User) {
    const comment = await this.commentRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== user.id) {
      throw new ForbiddenException('Not your comment');
    }
    await this.commentRepo.remove(comment);
    return { success: true };
  }
}
