import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JournalPostDocument = HydratedDocument<JournalPost>;

@Schema({ timestamps: true })
export class JournalPost {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  excerpt: string;

  @Prop({ default: '' })
  body: string;

  @Prop({ default: '' })
  coverImage: string;

  @Prop({ default: false })
  published: boolean;

  @Prop({ type: Date, default: null })
  publishedAt: Date | null;
}

export const JournalPostSchema = SchemaFactory.createForClass(JournalPost);
