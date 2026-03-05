import { IsString, IsEmail, IsEnum, MinLength, MaxLength } from 'class-validator';
import { Gender } from '../../users/entities/user.entity';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  username: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(4)
  password: string;

  @IsEmail()
  email: string;

  @IsEnum(Gender)
  gender: Gender;
}
