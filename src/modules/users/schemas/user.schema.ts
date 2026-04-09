import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true, unique: true, trim: true })
  username!: string;

  @Prop({ required: true })
  passwordHash!: string;

  @Prop({ type: Date, default: null })
  emailVerifiedAt!: Date | null;

  @Prop({ type: String, default: null })
  emailVerificationCodeHash!: string | null;

  @Prop({ type: Date, default: null })
  emailVerificationCodeExpiresAt!: Date | null;

  @Prop({ type: String, default: null })
  accessToken!: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
