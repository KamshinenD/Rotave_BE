import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;

@Schema({ _id: false })
export class SocialLinks {
  @Prop({ default: '' })
  instagram: string;

  @Prop({ default: '' })
  facebook: string;

  @Prop({ default: '' })
  twitter: string;

  @Prop({ default: '' })
  tiktok: string;

  @Prop({ default: '' })
  youtube: string;

  @Prop({ default: '' })
  linkedin: string;
}

export const SocialLinksSchema = SchemaFactory.createForClass(SocialLinks);

@Schema({ timestamps: true })
export class Settings {
  @Prop({ default: 'singleton', unique: true })
  key: string;

  @Prop({ type: SocialLinksSchema, default: () => ({}) })
  socialLinks: SocialLinks;

  @Prop({ default: 'kjoeldewan@gmail.com' })
  notifyEmail: string;

  @Prop({ default: 'Rotave Wellness' })
  brandName: string;

  @Prop({ default: 'Rooted in nature. Grown for wellness.' })
  brandTagline: string;

  @Prop({ default: '' })
  brandDescription: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
