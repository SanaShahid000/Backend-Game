import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private readonly isConfigured: boolean;
  private readonly isProduction: boolean;
  private readonly logVerificationCode: boolean;
  private readonly requireSendGrid: boolean;
  private readonly sendGridEnabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY') ?? '';
    this.from =
      this.configService.get<string>('SENDGRID_FROM') ??
      this.configService.get<string>('SMTP_FROM') ??
      'no-reply@example.com';

    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    this.isProduction = nodeEnv === 'production';
    this.logVerificationCode =
      !this.isProduction &&
      this.configService.get<string>('LOG_EMAIL_VERIFICATION_CODE') === 'true';
    this.requireSendGrid =
      this.configService.get<string>('REQUIRE_SENDGRID') === 'true';
    this.sendGridEnabled =
      this.configService.get<string>('SENDGRID_ENABLED') === 'true';

    this.isConfigured = this.sendGridEnabled && apiKey.length > 0;
    if (this.isConfigured) {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendEmailVerificationCode(params: { to: string; code: string }) {
    if (this.logVerificationCode) {
      console.log(`Email verification code for ${params.to}: ${params.code}`);
      this.logger.log(
        `Email verification code for ${params.to}: ${params.code}`,
      );
    }

    if (!this.sendGridEnabled) {
      if (this.isProduction || this.requireSendGrid) {
        throw new Error('SendGrid is disabled');
      }
      return;
    }

    if (!this.isConfigured) {
      if (this.isProduction || this.requireSendGrid) {
        throw new Error('SendGrid is not configured');
      }
      return;
    }

    await sgMail.send({
      from: this.from,
      to: params.to,
      subject: 'Verify your email',
      text: `Your verification code is: ${params.code}`,
    });
  }
}
