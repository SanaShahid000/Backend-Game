import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(userId: Types.ObjectId) {
    return await this.userModel.findById(userId).exec();
  }

  async createUser(params: {
    email: string;
    username: string;
    passwordHash: string;
  }) {
    const existing = await this.userModel
      .findOne({
        $or: [
          { email: params.email.toLowerCase() },
          { username: params.username },
        ],
      })
      .exec();
    if (existing) {
      throw new ConflictException('Email or username already in use');
    }

    return await this.userModel.create({
      email: params.email.toLowerCase(),
      username: params.username,
      passwordHash: params.passwordHash,
      emailVerifiedAt: null,
      emailVerificationCodeHash: null,
      emailVerificationCodeExpiresAt: null,
    });
  }

  async setEmailVerificationCode(params: {
    userId: Types.ObjectId;
    codeHash: string;
    expiresAt: Date;
  }) {
    const updated = await this.userModel
      .findByIdAndUpdate(
        params.userId,
        {
          emailVerificationCodeHash: params.codeHash,
          emailVerificationCodeExpiresAt: params.expiresAt,
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async markEmailVerified(userId: Types.ObjectId) {
    const updated = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          emailVerifiedAt: new Date(),
          emailVerificationCodeHash: null,
          emailVerificationCodeExpiresAt: null,
        },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async setAccessToken(userId: Types.ObjectId, accessToken: string) {
    const updated = await this.userModel
      .findByIdAndUpdate(userId, { accessToken }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return updated;
  }

  async deleteById(userId: Types.ObjectId) {
    const deleted = await this.userModel.findByIdAndDelete(userId).exec();
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    return deleted;
  }
}
