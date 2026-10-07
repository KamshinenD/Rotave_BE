import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ default: '' })
  size: string;

  @Prop({ default: '' })
  badge: string;

  @Prop({ type: [String], default: [] })
  benefits: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isComingSoon: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
