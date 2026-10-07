import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { PageKey } from '../../common/enums/page-key.enum';

export type PageDocument = HydratedDocument<Page>;

@Schema({ timestamps: true, minimize: false })
export class Page {
  @Prop({ required: true, unique: true, enum: PageKey })
  key: PageKey;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  sections: Record<string, unknown>;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId | null;
}

export const PageSchema = SchemaFactory.createForClass(Page);
