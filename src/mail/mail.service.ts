import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendOtp(
    email: string,
    otp: string,
    purpose: 'VERIFY_EMAIL' | 'FORGOT_PASSWORD' = 'VERIFY_EMAIL',
  ): Promise<void> {
    const subject =
      purpose === 'FORGOT_PASSWORD'
        ? 'Eventra - Password Reset Code'
        : 'Eventra - Email Verification Code';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
        <h2>Eventra</h2>
        <p>Your one-time verification code is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code will expire shortly. If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}`, error as Error);
    }
  }
}
