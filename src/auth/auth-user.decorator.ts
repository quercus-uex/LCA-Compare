import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserJwt {
  sub: string;
  email: string;
}

export const AuthUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return request.user as UserJwt;
  },
);
