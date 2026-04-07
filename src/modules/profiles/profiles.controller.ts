import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { UsersService } from '../users/users.service';
import { ProfilesService } from './profiles.service';
import { UpdateCountryDto } from './dto/update-country.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type RequestWithUser = Request & { user: JwtPayload };

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
  ) {}

  @Get('me')
  async getMe(@Req() req: RequestWithUser) {
    const userId = this.parseObjectId(req.user.sub);
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profilesService.findByUserId(userId);
    return {
      status: 200,
      message: 'Profile retrieved successfully',
      data: {
        username: user.username,
        profilePicture: profile?.profilePicture ?? null,
        country: profile?.country ?? null,
      },
    };
  }

  @Get(':userId')
  async getByUserId(@Param('userId') userId: string) {
    const parsedUserId = this.parseObjectId(userId);
    const user = await this.usersService.findById(parsedUserId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profilesService.findByUserId(parsedUserId);
    return {
      status: 200,
      message: 'Profile retrieved successfully',
      data: {
        username: user.username,
        profilePicture: profile?.profilePicture ?? null,
        country: profile?.country ?? null,
      },
    };
  }

  @Patch('me/country')
  async updateCountry(
    @Body() dto: UpdateCountryDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = this.parseObjectId(req.user.sub);
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profilesService.upsertProfile({
      userId,
      country: dto.country,
    });

    return {
      status: 200,
      message: 'Country updated successfully',
      data: {
        username: user.username,
        profilePicture: profile.profilePicture ?? null,
        country: profile.country ?? null,
      },
    };
  }

  @Patch('me')
  async updateMe(@Body() dto: UpdateProfileDto, @Req() req: RequestWithUser) {
    const userId = this.parseObjectId(req.user.sub);
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profilesService.upsertProfile({
      userId,
      ...(dto.profilePicture !== undefined
        ? { profilePicture: dto.profilePicture }
        : {}),
      ...(dto.country !== undefined ? { country: dto.country } : {}),
    });

    return {
      status: 200,
      message: 'Profile updated successfully',
      data: {
        username: user.username,
        profilePicture: profile.profilePicture ?? null,
        country: profile.country ?? null,
      },
    };
  }

  @Delete('me')
  async deleteMe(@Req() req: RequestWithUser) {
    const userId = this.parseObjectId(req.user.sub);
    
    // Delete profile first
    await this.profilesService.deleteByUserId(userId);
    
    // Then delete user
    await this.usersService.deleteById(userId);

    return {
      status: 200,
      message: 'Account deleted successfully',
    };
  }

  private parseObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid user id in token');
    }
    return new Types.ObjectId(value);
  }
}
