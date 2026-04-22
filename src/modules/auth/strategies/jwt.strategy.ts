import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Types } from 'mongoose';
import { JwtPayload } from '../../../common/types/jwt-payload.type';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
    const secretFromEnv = configService.get<string>('JWT_SECRET');
    const secret =
      secretFromEnv || (nodeEnv === 'production' ? '' : 'dev-jwt-secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(new Types.ObjectId(payload.sub));

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokenLastLogout = payload.lastLogoutAt ? new Date(payload.lastLogoutAt) : null;
    const userLastLogout = user.lastLogoutAt;

    if (tokenLastLogout?.getTime() !== userLastLogout?.getTime()) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    return payload;
  }
}
