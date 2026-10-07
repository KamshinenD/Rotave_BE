import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Faq, FaqDocument } from './schemas/faq.schema';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  constructor(@InjectModel(Faq.name) private faqModel: Model<FaqDocument>) {}

  async create(dto: CreateFaqDto): Promise<FaqDocument> {
    return this.faqModel.create(dto);
  }

  async findAllPublic(): Promise<FaqDocument[]> {
    return this.faqModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findAllAdmin(): Promise<FaqDocument[]> {
    return this.faqModel.find().sort({ sortOrder: 1 }).exec();
  }

  async update(id: string, dto: UpdateFaqDto): Promise<FaqDocument> {
    const faq = await this.faqModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return faq;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.faqModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('FAQ not found');
    }
    return { deleted: true };
  }
}
