import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ProfileDocument = HydratedDocument<Profile>;

@Schema({ timestamps: true })
export class Profile {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({ type: String, default: null })
  profilePicture!: string | null;

  @Prop({ type: String, default: null })
  country!: string | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  carDetails!: Record<string, any> | null;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
