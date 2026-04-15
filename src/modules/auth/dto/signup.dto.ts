import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  username!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  country?: string;
}
