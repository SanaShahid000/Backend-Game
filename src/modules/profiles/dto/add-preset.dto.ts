import { IsNotEmpty, IsString } from 'class-validator';

export class AddPresetDto {
  @IsString()
  @IsNotEmpty()
  preset!: string;
}
