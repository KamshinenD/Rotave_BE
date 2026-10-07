import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ContactMessage,
  ContactMessageDocument,
} from './schemas/contact-message.schema';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ContactService {
  constructor(
    @InjectModel(ContactMessage.name)
    private contactModel: Model<ContactMessageDocument>,
    private mailService: MailService,
  ) {}

  async create(dto: CreateContactDto): Promise<ContactMessageDocument> {
    const msg = await this.contactModel.create(dto);
    await this.mailService.notifyAdmin(
      `Contact: ${dto.subject}`,
      `From: ${dto.name} <${dto.email}>\n\n${dto.message}`,
    );
    return msg;
  }

  async findAll(): Promise<ContactMessageDocument[]> {
    return this.contactModel.find().sort({ createdAt: -1 }).exec();
  }

  async update(
    id: string,
    dto: UpdateContactDto,
  ): Promise<ContactMessageDocument> {
    const msg = await this.contactModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!msg) {
      throw new NotFoundException('Contact message not found');
    }
    return msg;
  }
}
