import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { MailModule } from '../../mail/mail.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
        const secretFromEnv = configService.get<string>('JWT_SECRET');
        const secret =
          secretFromEnv || (nodeEnv === 'production' ? '' : 'dev-jwt-secret');
        if (!secret) {
          throw new Error('JWT_SECRET is not set');
        }

        const rawExpiresIn =
          configService.get<string>('JWT_EXPIRES_IN') ?? '1d';
        const expiresIn = /^\d+$/.test(rawExpiresIn)
          ? Number(rawExpiresIn)
          : (rawExpiresIn as StringValue);

        return {
          secret,
          signOptions: {
            expiresIn,
          },
        };
      },
    }),
    MailModule,
    UsersModule,
    ProfilesModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
