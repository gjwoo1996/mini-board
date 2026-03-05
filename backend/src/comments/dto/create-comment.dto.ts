import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @Transform(({ value }) => (value ? +value : null))
  @IsNumber()
  parentId?: number | null;
}
