import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private stubbed = true;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const enabled = this.config.get<string>('EMAIL_ENABLED') !== 'false';
    const hasBrevo = !!this.config.get<string>('BREVO_API_KEY')?.trim();
    const host = this.config.get<string>('SMTP_HOST')?.trim();

    if (!enabled) {
      this.logger.warn('EMAIL_ENABLED=false — mail stubbed');
      this.stubbed = true;
      return;
    }

    if (hasBrevo) {
      this.stubbed = false;
      this.logger.log('Mail configured via Brevo API');
      return;
    }

    if (host) {
      const options: SMTPTransport.Options = {
        host,
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: false,
        auth: {
          user: this.config.get<string>('SMTP_USER') || '',
          pass: this.config.get<string>('SMTP_PASS') || '',
        },
      };
      this.transporter = nodemailer.createTransport(options);
      this.stubbed = false;
      this.logger.log(`Mail transporter configured for ${host}`);
      return;
    }

    this.logger.warn('No Brevo/SMTP config — mail will be stubbed (logged only)');
    this.stubbed = true;
  }

  private fromAddress(): string {
    return (
      this.config.get<string>('MAIL_FROM') ||
      'Rotave Wellness <noreply@rotave.com>'
    );
  }

  private parseFrom(from: string): { name?: string; email: string } {
    const match = from.match(/^(.*)<([^>]+)>$/);
    if (match) {
      return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].trim() };
    }
    return { email: from.trim() };
  }

  async sendMail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    const from = this.fromAddress();
    const html =
      options.html ||
      `<pre style="font-family:sans-serif;white-space:pre-wrap">${options.text || ''}</pre>`;

    if (this.stubbed) {
      this.logger.log(
        `[STUB MAIL] to=${options.to} subject="${options.subject}" body=${options.text || options.html || ''}`,
      );
      return;
    }

    const brevoKey = this.config.get<string>('BREVO_API_KEY')?.trim();
    if (brevoKey) {
      await this.sendViaBrevo({
        apiKey: brevoKey,
        from,
        to: options.to,
        subject: options.subject,
        html,
      });
      return;
    }

    if (!this.transporter) {
      this.logger.warn(`No transporter — dropping mail to ${options.to}`);
      return;
    }

    await this.transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html,
    });
  }

  private async sendViaBrevo(opts: {
    apiKey: string;
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const sender = this.parseFrom(opts.from);
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': opts.apiKey,
      },
      body: JSON.stringify({
        sender,
        to: [{ email: opts.to }],
        subject: opts.subject,
        htmlContent: opts.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`Brevo API error ${res.status}: ${body}`);
      throw new Error(`Failed to send email (Brevo ${res.status})`);
    }
  }

  async notifyAdmin(subject: string, text: string): Promise<void> {
    const to =
      this.config.get<string>('ADMIN_NOTIFY_EMAIL') ||
      'kjoeldewan@gmail.com';
    await this.sendMail({
      to,
      subject,
      text,
      html: this.wrapHtml(subject, `<p>${text.replace(/\n/g, '<br/>')}</p>`),
    });
  }

  async sendAdminOtp(to: string, name: string, otp: string): Promise<void> {
    const spaced = otp.split('').join('&nbsp;&nbsp;');
    await this.sendMail({
      to,
      subject: 'Your Rotave admin login code',
      text: `Hello ${name},\n\nYour admin login code is ${otp}. It expires in 10 minutes.`,
      html: this.wrapHtml(
        'Your admin login code',
        `
        <p>Hello ${name || 'Admin'},</p>
        <p>Use the 6-digit code below to sign in to the Rotave Wellness admin dashboard:</p>
        <div style="margin:24px 0;text-align:center;">
          <div style="display:inline-block;background:#f6f2e9;border:1px solid rgba(12,24,18,0.15);border-radius:8px;padding:18px 28px;font-family:Menlo,Consolas,monospace;font-size:30px;font-weight:700;letter-spacing:4px;color:#0c1812;">
            ${spaced}
          </div>
        </div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#6b705c;font-size:13px;">If you didn’t try to sign in, you can ignore this email.</p>
      `,
      ),
    });
  }

  async sendOrderConfirmation(opts: {
    to: string;
    customerName: string;
    orderId: string;
    itemSummary: string;
    address: string;
  }): Promise<void> {
    await this.sendMail({
      to: opts.to,
      subject: 'We received your Rotave order request',
      text: `Hello ${opts.customerName},\n\nThanks for your order request (${opts.orderId}).\n\n${opts.itemSummary}\n\nDelivery: ${opts.address}\n\nWe'll contact you shortly to confirm payment and delivery.`,
      html: this.wrapHtml(
        'Order request received',
        `
        <p>Hello ${opts.customerName},</p>
        <p>Thank you for your Rotave Wellness order request. Our team will contact you shortly to confirm payment and delivery.</p>
        <p><strong>Reference:</strong> ${opts.orderId}</p>
        <p><strong>Items:</strong><br/>${opts.itemSummary.replace(/\n/g, '<br/>')}</p>
        <p><strong>Delivery address:</strong><br/>${opts.address}</p>
        <p style="color:#6b705c;font-size:13px;">Nature. Wellness. Impact.</p>
      `,
      ),
    });
  }

  async sendWelcomeCustomer(to: string, name: string): Promise<void> {
    const site = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    await this.sendMail({
      to,
      subject: 'Welcome to Rotave Wellness',
      text: `Hello ${name},\n\nWelcome to Rotave Wellness. You can shop at ${site}/shop.`,
      html: this.wrapHtml(
        'Welcome to Rotave',
        `
        <p>Hello ${name},</p>
        <p>Welcome to Rotave Wellness — nature, wellness, and impact, from the ground up.</p>
        <p><a href="${site}/shop" style="color:#c5a059;">Explore the shop</a></p>
      `,
      ),
    });
  }

  async sendNewsletterWelcome(to: string): Promise<void> {
    await this.sendMail({
      to,
      subject: 'You’re on the Rotave journey',
      text: 'Thanks for joining the Rotave Wellness newsletter.',
      html: this.wrapHtml(
        'Thanks for joining',
        `<p>You’re on the list. We’ll share rituals, stories from the field, and new drops as Rotave grows.</p>`,
      ),
    });
  }

  private wrapHtml(heading: string, body: string): string {
    return `<!DOCTYPE html><html><body style="margin:0;background:#f6f2e9;font-family:Georgia,serif;">
      <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#c5a059;">Rotave Wellness</p>
        <h1 style="margin:0 0 20px;font-size:26px;color:#0c1812;">${heading}</h1>
        <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#0c1812;">${body}</div>
      </div>
    </body></html>`;
  }
}
