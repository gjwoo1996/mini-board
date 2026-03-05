import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/post-image.entity';
import { PostTag } from './entities/post-tag.entity';
import { Like } from './entities/like.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { SearchService } from '../search/search.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PostsService {
  private uploadPath =
    process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Post)
    private postRepo: Repository<Post>,
    @InjectRepository(PostImage)
    private postImageRepo: Repository<PostImage>,
    @InjectRepository(PostTag)
    private postTagRepo: Repository<PostTag>,
    @InjectRepository(Like)
    private likeRepo: Repository<Like>,
    private searchService: SearchService,
  ) {
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async create(
    dto: CreatePostDto,
    author: User,
    files?: Express.Multer.File[],
  ) {
    const post = await this.postRepo.save({
      title: dto.title,
      content: dto.content,
      categoryId: dto.categoryId,
      authorId: author.id,
    });
    if (files?.length) {
      const images = files.slice(0, 10).map((f, i) => ({
        postId: post.id,
        filePath: f.filename || path.basename(f.path || ''),
        order: i,
      }));
      await this.postImageRepo.save(images);
    }
    if (dto.tags?.length) {
      await this.postTagRepo.save(
        dto.tags.slice(0, 5).map((tagName) => ({
          postId: post.id,
          tagName: String(tagName).trim(),
        })),
      );
    }
    const full = await this.findOne(post.id);
    this.syncToSearch(full, false).catch(() => {});
    return full;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: number;
    searchTitle?: string;
    searchContent?: string;
    searchAuthor?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, params.limit || 50);
    const skip = (page - 1) * limit;

    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.images', 'images')
      .leftJoinAndSelect('post.tags', 'tags')
      .orderBy('post.createdAt', 'DESC');

    if (params.categoryId) {
      qb.andWhere('post.categoryId = :categoryId', {
        categoryId: params.categoryId,
      });
    }
    if (params.searchTitle) {
      qb.andWhere('post.title LIKE :title', {
        title: `%${params.searchTitle}%`,
      });
    }
    if (params.searchContent) {
      qb.andWhere('post.content LIKE :content', {
        content: `%${params.searchContent}%`,
      });
    }
    if (params.searchAuthor) {
      qb.andWhere('author.name LIKE :authorName', {
        authorName: `%${params.searchAuthor}%`,
      });
    }
    if (params.dateFrom) {
      qb.andWhere('post.createdAt >= :dateFrom', {
        dateFrom: new Date(params.dateFrom),
      });
    }
    if (params.dateTo) {
      qb.andWhere('post.createdAt <= :dateTo', {
        dateTo: new Date(params.dateTo),
      });
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const posts = await Promise.all(
      items.map(async (p) => {
        const raw = await this.postRepo.manager
          .createQueryBuilder()
          .select('COUNT(*)', 'count')
          .from('comments', 'c')
          .where('c.postId = :postId', { postId: p.id })
          .getRawOne<{ count: string }>();
        return {
          ...p,
          commentCount: parseInt(raw?.count ?? '0', 10),
        };
      }),
    );

    return { items: posts, total, page, limit };
  }

  async findPopular(limit = 30) {
    return this.postRepo.find({
      relations: ['author', 'category', 'images', 'tags'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: number, incrementView = false) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author', 'category', 'images', 'tags'],
    });
    if (!post) throw new NotFoundException('Post not found');
    if (incrementView) {
      await this.postRepo.increment({ id }, 'viewCount', 1);
      post.viewCount += 1;
    }
    const raw = await this.postRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('comments', 'c')
      .where('c.postId = :postId', { postId: id })
      .getRawOne<{ count: string }>();
    return {
      ...post,
      commentCount: parseInt(raw?.count ?? '0', 10),
    };
  }

  async update(id: number, dto: UpdatePostDto, user: User) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== user.id)
      throw new ForbiddenException('Not your post');
    const { tags, ...updateData } = dto;
    await this.postRepo.update(id, {
      ...updateData,
      isModified: true,
    });
    if (tags !== undefined) {
      await this.postTagRepo.delete({ postId: id });
      if (tags.length) {
        await this.postTagRepo.save(
          tags.slice(0, 5).map((tagName) => ({
            postId: id,
            tagName: String(tagName).trim(),
          })),
        );
      }
    }
    const full = await this.findOne(id);
    this.syncToSearch(full, true).catch(() => {});
    return full;
  }

  async remove(id: number, user: User) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== user.id)
      throw new ForbiddenException('Not your post');
    await this.postRepo.remove(post);
    this.searchService.deletePost(id).catch(() => {});
    return { success: true };
  }

  private async syncToSearch(
    post: Post & {
      tags?: { tagName: string }[];
      category?: { id: number; name: string };
      author?: { id: number; name: string };
    },
    isUpdate = false,
  ) {
    const tags = (post.tags ?? []).map((t) => t.tagName ?? '');
    const doc = {
      id: post.id,
      title: post.title,
      content: post.content,
      tags,
      categoryId: post.category?.id ?? post.categoryId,
      categoryName: post.category?.name ?? '',
      authorId: post.author?.id ?? post.authorId,
      authorName: post.author?.name ?? '',
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
    if (isUpdate) {
      await this.searchService.updatePost(doc);
    } else {
      await this.searchService.indexPost(doc);
    }
  }

  async like(postId: number, user: User) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    const existing = await this.likeRepo.findOne({
      where: { postId, userId: user.id },
    });
    if (existing) {
      await this.likeRepo.remove(existing);
      await this.postRepo.decrement({ id: postId }, 'likeCount', 1);
      return { liked: false, likeCount: post.likeCount - 1 };
    }
    await this.likeRepo.save({ postId, userId: user.id });
    await this.postRepo.increment({ id: postId }, 'likeCount', 1);
    return { liked: true, likeCount: post.likeCount + 1 };
  }
}
