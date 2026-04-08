import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile } from './schemas/profile.schema';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<Profile>,
  ) {}

  async createForUser(params: {
    userId: Types.ObjectId;
    profilePicture?: string | null;
    country?: string | null;
  }) {
    return await this.profileModel.create({
      userId: params.userId,
      profilePicture: params.profilePicture ?? null,
      country: params.country ?? null,
    });
  }

  async findByUserId(userId: Types.ObjectId) {
    return await this.profileModel.findOne({ userId }).exec();
  }

  async upsertProfile(params: {
    userId: Types.ObjectId;
    profilePicture?: string | null;
    country?: string | null;
  }) {
    const update: Record<string, unknown> = {};
    if (params.profilePicture !== undefined) {
      update.profilePicture = params.profilePicture;
    }
    if (params.country !== undefined) {
      update.country = params.country;
    }

    return await this.profileModel
      .findOneAndUpdate(
        { userId: params.userId },
        { $set: update },
        { new: true, upsert: true },
      )
      .exec();
  }

  async deleteByUserId(userId: Types.ObjectId) {
    return await this.profileModel.findOneAndDelete({ userId }).exec();
  }

  async addCarPreset(userId: Types.ObjectId, preset: string) {
    return await this.profileModel
      .findOneAndUpdate(
        { userId },
        { $push: { carPresets: preset } },
        { new: true, upsert: true },
      )
      .exec();
  }

  async getCarPresets(userId: Types.ObjectId) {
    const profile = await this.profileModel.findOne({ userId }).exec();
    return profile?.carPresets ?? [];
  }
}
