import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  NewsletterSubscriber,
  NewsletterSubscriberDocument,
} from './schemas/newsletter-subscriber.schema';
import { SubscribeDto } from './dto/subscribe.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class NewsletterService {
  constructor(
    @InjectModel(NewsletterSubscriber.name)
    private subscriberModel: Model<NewsletterSubscriberDocument>,
    private mailService: MailService,
  ) {}

  async subscribe(dto: SubscribeDto): Promise<{ message: string }> {
    const email = dto.email.toLowerCase();
    const existing = await this.subscriberModel.findOne({ email });
    if (existing) {
      throw new ConflictException('Email already subscribed');
    }
    await this.subscriberModel.create({ email, subscribedAt: new Date() });
    Promise.resolve()
      .then(() => this.mailService.sendNewsletterWelcome(email))
      .catch(() => undefined);
    return { message: 'Subscribed successfully' };
  }

  async findAll(): Promise<NewsletterSubscriberDocument[]> {
    return this.subscriberModel.find().sort({ subscribedAt: -1 }).exec();
  }
}
