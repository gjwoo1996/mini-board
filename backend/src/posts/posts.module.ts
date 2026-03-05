import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { PostImage } from './entities/post-image.entity';
import { PostTag } from './entities/post-tag.entity';
import { Like } from './entities/like.entity';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { CategoriesModule } from '../categories/categories.module';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostImage, PostTag, Like]),
    CategoriesModule,
    SearchModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService, TypeOrmModule],
})
export class PostsModule {}
