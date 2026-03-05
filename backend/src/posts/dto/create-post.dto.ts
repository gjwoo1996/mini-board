import {
  IsString,
  IsNumber,
  IsArray,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  content: string;

  @Transform(({ value }) => (value ? +value : undefined))
  @IsNumber()
  categoryId: number;

  @IsArray()
  @ArrayMaxSize(5)
  @Transform(({ value }): string[] => {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try {
        return value ? (JSON.parse(value) as string[]) : [];
      } catch {
        return value
          .split(',')
          .map((s: string) => s.trim())
          .filter((s): s is string => Boolean(s));
      }
    }
    return [];
  })
  tags: string[] = [];
}
