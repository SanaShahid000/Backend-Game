import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { MailService } from '../../mail/mail.service';
import { ProfilesService } from '../profiles/profiles.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(params: { email: string; username: string; password: string }) {
    const passwordHash = await bcrypt.hash(params.password, 12);
    const user = await this.usersService.createUser({
      email: params.email,
      username: params.username,
      passwordHash,
    });

    await this.profilesService.createForUser({
      userId: user._id,
    });

    const code = this.generateSixDigitCode();
    const codeHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.setEmailVerificationCode({
      userId: user._id,
      codeHash,
      expiresAt,
    });

    await this.mailService.sendEmailVerificationCode({ to: user.email, code });

    return { message: 'Verification code sent' };
  }

  async resendCode(params: { email: string }) {
    const user = await this.usersService.findByEmail(params.email);
    if (!user) {
      throw new BadRequestException('Invalid email');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }

    const code = this.generateSixDigitCode();
    const codeHash = await bcrypt.hash(code, 12);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.setEmailVerificationCode({
      userId: user._id,
      codeHash,
      expiresAt,
    });

    await this.mailService.sendEmailVerificationCode({ to: user.email, code });

    return { message: 'Verification code resent' };
  }

  async verifyEmail(params: { email: string; code: string }) {
    const user = await this.usersService.findByEmail(params.email);
    if (!user) {
      throw new BadRequestException('Invalid verification request');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email already verified' };
    }

    if (
      !user.emailVerificationCodeHash ||
      !user.emailVerificationCodeExpiresAt
    ) {
      throw new BadRequestException('Verification code not found');
    }

    if (user.emailVerificationCodeExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code expired');
    }

    const ok = await bcrypt.compare(
      params.code,
      user.emailVerificationCodeHash,
    );
    if (!ok) {
      throw new BadRequestException('Invalid verification code');
    }

    await this.usersService.markEmailVerified(user._id);

    return await this.getAuthResponse(user);
  }

  async logout(userId: Types.ObjectId) {
    await this.usersService.setLastLogout(userId);
    return { message: 'Logged out successfully' };
  }

  async login(params: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(params.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException('Email verification required');
    }

    return await this.getAuthResponse(user);
  }

  private async getAuthResponse(user: any) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      lastLogoutAt: user.lastLogoutAt?.toISOString() ?? null,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      noTimestamp: true,
    });
    const profile = await this.profilesService.findByUserId(user._id);

    return {
      accessToken,
      profile: {
        userId: user._id.toString(),
        username: user.username,
        profilePicture: profile?.profilePicture ?? null,
      },
    };
  }

  private generateSixDigitCode() {
    return String(randomInt(0, 1_000_000)).padStart(6, '0');
  }
}
