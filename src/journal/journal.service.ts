import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  JournalPost,
  JournalPostDocument,
} from './schemas/journal-post.schema';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class JournalService {
  constructor(
    @InjectModel(JournalPost.name)
    private journalModel: Model<JournalPostDocument>,
  ) {}

  async create(dto: CreateJournalDto): Promise<JournalPostDocument> {
    const slug = dto.slug || slugify(dto.title);
    const existing = await this.journalModel.findOne({ slug });
    if (existing) {
      throw new ConflictException('Journal slug already exists');
    }
    const published = dto.published ?? false;
    return this.journalModel.create({
      ...dto,
      slug,
      published,
      publishedAt: published ? new Date() : null,
    });
  }

  async findAllPublic(): Promise<JournalPostDocument[]> {
    return this.journalModel
      .find({ published: true })
      .sort({ publishedAt: -1 })
      .exec();
  }

  async findAllAdmin(): Promise<JournalPostDocument[]> {
    return this.journalModel.find().sort({ createdAt: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<JournalPostDocument> {
    const post = await this.journalModel
      .findOne({ slug, published: true })
      .exec();
    if (!post) {
      throw new NotFoundException('Journal post not found');
    }
    return post;
  }

  async update(id: string, dto: UpdateJournalDto): Promise<JournalPostDocument> {
    const post = await this.journalModel.findById(id);
    if (!post) {
      throw new NotFoundException('Journal post not found');
    }
    if (dto.slug && dto.slug !== post.slug) {
      const clash = await this.journalModel.findOne({ slug: dto.slug });
      if (clash) {
        throw new ConflictException('Journal slug already exists');
      }
    }
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.slug !== undefined) post.slug = dto.slug;
    if (dto.excerpt !== undefined) post.excerpt = dto.excerpt;
    if (dto.body !== undefined) post.body = dto.body;
    if (dto.coverImage !== undefined) post.coverImage = dto.coverImage;
    if (dto.published !== undefined) {
      if (dto.published && !post.published) {
        post.publishedAt = new Date();
      }
      if (!dto.published) {
        post.publishedAt = null;
      }
      post.published = dto.published;
    }
    await post.save();
    return post;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.journalModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Journal post not found');
    }
    return { deleted: true };
  }
}
