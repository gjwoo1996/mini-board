import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

const uploadDir = process.env.UPLOAD_PATH || './uploads';

const storage = diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Public()
  @Get('popular')
  getPopular() {
    return this.postsService.findPopular(30);
  }

  @Public()
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
    @Query('searchTitle') searchTitle?: string,
    @Query('searchContent') searchContent?: string,
    @Query('searchAuthor') searchAuthor?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.postsService.findAll({
      page: page ? +page : 1,
      limit: limit ? +limit : 50,
      categoryId: categoryId ? +categoryId : undefined,
      searchTitle,
      searchContent,
      searchAuthor,
      dateFrom,
      dateTo,
    });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(+id, true);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'images', maxCount: 10 }], {
      storage,
    }),
  )
  create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: User,
    @UploadedFiles() files?: { images?: Express.Multer.File[] },
  ) {
    const tags =
      typeof dto.tags === 'string'
        ? (dto.tags ? JSON.parse(dto.tags) : [])
        : dto.tags || [];
    return this.postsService.create(
      { ...dto, tags },
      user,
      files?.images,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: User,
  ) {
    const tags =
      dto.tags !== undefined
        ? typeof dto.tags === 'string'
          ? (dto.tags ? JSON.parse(dto.tags) : [])
          : dto.tags
        : undefined;
    return this.postsService.update(+id, { ...dto, tags }, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.remove(+id, user);
  }

  @Post(':id/like')
  like(@Param('id') id: string, @CurrentUser() user: User) {
    return this.postsService.like(+id, user);
  }
}
