import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './schemas/settings.schema';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
  ) {}

  async get(): Promise<SettingsDocument> {
    let settings = await this.settingsModel.findOne({ key: 'singleton' }).exec();
    if (!settings) {
      settings = await this.settingsModel.create({ key: 'singleton' });
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<SettingsDocument> {
    const settings = await this.get();
    if (dto.socialLinks) {
      settings.socialLinks = {
        ...settings.socialLinks,
        ...dto.socialLinks,
      } as Settings['socialLinks'];
    }
    if (dto.notifyEmail !== undefined) settings.notifyEmail = dto.notifyEmail;
    if (dto.brandName !== undefined) settings.brandName = dto.brandName;
    if (dto.brandTagline !== undefined) settings.brandTagline = dto.brandTagline;
    if (dto.brandDescription !== undefined) {
      settings.brandDescription = dto.brandDescription;
    }
    await settings.save();
    return settings;
  }
}
