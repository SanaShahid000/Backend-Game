import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: unknown, user: TUser, info: unknown): TUser {
    if (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException('Unauthorized');
    }

    if (user) {
      return user;
    }

    const infoName =
      typeof info === 'object' &&
      info !== null &&
      'name' in info &&
      typeof (info as { name?: unknown }).name === 'string'
        ? (info as { name?: string }).name
        : undefined;

    const message =
      infoName === 'TokenExpiredError'
        ? 'Token expired'
        : infoName === 'JsonWebTokenError'
          ? 'Invalid token'
          : 'Unauthorized';

    throw new UnauthorizedException(message);
  }
}
