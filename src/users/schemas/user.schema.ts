import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, enum: Role, default: Role.CUSTOMER })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  /** Admin login OTP (cleared after use) */
  @Prop({ type: String, required: false, default: null })
  otp?: string | null;

  @Prop({ type: Date, required: false, default: null })
  otpExpiresAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
