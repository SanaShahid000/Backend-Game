import { IsNotEmpty, IsObject } from 'class-validator';

export class AddPresetDto {
  @IsObject()
  @IsNotEmpty()
  preset!: Record<string, any>;
}
