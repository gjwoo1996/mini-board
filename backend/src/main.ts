import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const uploadPath = process.env.UPLOAD_PATH || join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadPath, { prefix: '/uploads/' });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
