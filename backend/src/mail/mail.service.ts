import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend?: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  async sendAlertEmail(email: string, subject: string, html: string) {
    if (!this.resend) {
      console.warn('RESEND_API_KEY is not configured. Skipping alert email.');
      return false;
    }

    const { data, error } = await this.resend.emails.send({
      from: 'TFMS Alerts <alerts@resend.dev>',
      to: [email],
      subject,
      html,
    });

    if (error) {
      return false;
    }
    return true;
  }
  async sendWelcomeEmail(email: string, username: string, otp: string) {
    if (!this.resend) {
      console.warn('RESEND_API_KEY is not configured. Skipping welcome email.');
      return false;
    }

    const { data, error } = await this.resend.emails.send({
      from: 'TFMS Factory <onboarding@resend.dev>', // Adjust this if you have a verified domain
      to: [email],
      subject: 'Welcome to TFMS - Secure Your Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Welcome to Textile Factory Management System</h2>
          <p>Hello <strong>${username}</strong>,</p>
          <p>Your account has been created. To secure your access, please use the following OTP (One-Time Password) to verify your identity:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0;">
            ${otp}
          </div>
          <p>Upon your first login, you will be required to update your password for security purposes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">If you did not expect this enrollment, please contact the factory HR department immediately.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email via Resend:', error);
      return false;
    }
    return true;
  }
}
