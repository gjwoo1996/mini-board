import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  @Get('me')
  getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      gender: user.gender,
      role: user.role,
    };
  }
}
