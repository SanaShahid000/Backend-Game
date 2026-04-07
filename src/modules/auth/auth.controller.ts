import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendCodeDto } from './dto/resend-code.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const result = await this.authService.signup(dto);
    return {
      status: 201,
      message: result.message,
    };
  }

  @Post('resend-code')
  async resendCode(@Body() dto: ResendCodeDto) {
    const result = await this.authService.resendCode(dto);
    return {
      status: 200,
      message: result.message,
    };
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(dto);
    return {
      status: 200,
      message: result.message,
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto);
    return {
      status: 200,
      message: 'Login successful',
      data: result,
    };
  }
}
