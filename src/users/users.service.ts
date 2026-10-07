import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateAdminDto): Promise<UserDocument> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const role =
      dto.role === Role.SUPERADMIN ? Role.SUPERADMIN : Role.ADMIN;
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash,
      role,
      isActive: true,
    });
  }

  async createCustomer(dto: {
    name: string;
    email: string;
    password: string;
  }): Promise<UserDocument> {
    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash,
      role: Role.CUSTOMER,
      isActive: true,
    });
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: { $in: [Role.SUPERADMIN, Role.ADMIN] } })
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async update(id: string, dto: UpdateAdminDto): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('Admin not found');
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    await user.save();
    const result = user.toObject();
    delete (result as { passwordHash?: string }).passwordHash;
    return result as UserDocument;
  }

  async deactivate(id: string): Promise<UserDocument> {
    return this.update(id, { isActive: false });
  }

  async setOtp(
    userId: string,
    otp: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { otp, otpExpiresAt: expiresAt } },
    );
  }

  async clearOtp(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $unset: { otp: 1, otpExpiresAt: 1 } },
    );
  }

  sanitize(user: UserDocument) {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete (obj as { passwordHash?: string }).passwordHash;
    delete (obj as { otp?: string }).otp;
    delete (obj as { otpExpiresAt?: Date }).otpExpiresAt;
    return obj;
  }
}
