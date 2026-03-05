import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';
import { Post } from '../posts/entities/post.entity';
import { PostImage } from '../posts/entities/post-image.entity';
import { PostTag } from '../posts/entities/post-tag.entity';
import { Like } from '../posts/entities/like.entity';
import { Comment } from '../comments/entities/comment.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { DatabaseSeeder } from './database.seeder';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.MYSQL_HOST || 'mysql',
      port: parseInt(process.env.MYSQL_PORT || '13306', 10),
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root1234',
      database: process.env.MYSQL_DATABASE || 'testDB',
      entities: [
        User,
        Category,
        Post,
        PostImage,
        PostTag,
        Like,
        Comment,
        RefreshToken,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
  ],
  providers: [DatabaseSeeder],
})
export class DatabaseModule {}
