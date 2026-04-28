import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
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
import { AddPresetDto } from './dto/add-preset.dto';

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
      data: this.formatProfileData(user.username, profile),
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
      data: this.formatProfileData(user.username, profile),
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
      data: this.formatProfileData(user.username, profile),
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
      data: this.formatProfileData(user.username, profile),
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

  @Post('me/presets')
  async addPreset(@Body() dto: AddPresetDto, @Req() req: RequestWithUser) {
    const userId = this.parseObjectId(req.user.sub);
    const profile = await this.profilesService.addCarPreset(userId, dto.preset);
    return {
      status: 200,
      message: 'Preset added successfully',
      data: profile.carPresets[0] ?? null,
    };
  }

  @Get('me/presets')
  async getPresets(@Req() req: RequestWithUser) {
    const userId = this.parseObjectId(req.user.sub);
    const presets = await this.profilesService.getCarPresets(userId);
    return {
      status: 200,
      message: 'Presets retrieved successfully',
      data: presets[0] ?? null,
    };
  }

  private formatProfileData(username: string, profile: any) {
    return {
      username,
      profilePicture: profile?.profilePicture ?? null,
      country: profile?.country ?? null,
      carPresets: profile?.carPresets?.[0] ?? null,
    };
  }

  private parseObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid user id in token');
    }
    return new Types.ObjectId(value);
  }
}
