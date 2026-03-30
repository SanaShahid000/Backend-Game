import { IsString, MinLength } from 'class-validator';

export class UpdateCountryDto {
  @IsString()
  @MinLength(2)
  country!: string;
}
