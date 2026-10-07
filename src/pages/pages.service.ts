import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Page, PageDocument } from './schemas/page.schema';
import { PageKey } from '../common/enums/page-key.enum';
import { UpdatePageDto } from './dto/update-page.dto';

@Injectable()
export class PagesService {
  constructor(@InjectModel(Page.name) private pageModel: Model<PageDocument>) {}

  async findByKey(key: string): Promise<PageDocument> {
    if (!Object.values(PageKey).includes(key as PageKey)) {
      throw new BadRequestException(`Invalid page key: ${key}`);
    }
    const page = await this.pageModel.findOne({ key }).exec();
    if (!page) {
      throw new NotFoundException('Page not found');
    }
    if (page.sections === undefined || page.sections === null) {
      page.sections = {};
    }
    return page;
  }

  async update(
    key: string,
    dto: UpdatePageDto,
    userId: string,
  ): Promise<PageDocument> {
    if (!Object.values(PageKey).includes(key as PageKey)) {
      throw new BadRequestException(`Invalid page key: ${key}`);
    }
    const page = await this.pageModel
      .findOneAndUpdate(
        { key },
        {
          $set: {
            sections: dto.sections ?? {},
            updatedBy: new Types.ObjectId(userId),
          },
        },
        { new: true, upsert: true },
      )
      .exec();
    return page!;
  }
}
