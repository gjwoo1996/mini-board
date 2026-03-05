import {
  IsString,
  IsNumber,
  IsArray,
  ArrayMaxSize,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @Transform(({ value }): string[] | undefined =>
    typeof value === 'string'
      ? (JSON.parse(value || '[]') as string[])
      : (value as string[] | undefined),
  )
  tags?: string[];
}
