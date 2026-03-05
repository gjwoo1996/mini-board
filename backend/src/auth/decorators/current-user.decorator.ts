import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | unknown => {
    const user = ctx.switchToHttp().getRequest().user as User;
    return data ? user?.[data] : user;
  },
);
