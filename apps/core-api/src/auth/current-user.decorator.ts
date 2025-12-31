import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserPayload = { userId: string; email: string };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
