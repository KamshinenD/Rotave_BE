import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Page, PageDocument } from '../pages/schemas/page.schema';
import { Faq, FaqDocument } from '../faq/schemas/faq.schema';
import { Settings, SettingsDocument } from '../settings/schemas/settings.schema';
import { Role } from '../common/enums/role.enum';
import { PageKey } from '../common/enums/page-key.enum';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private config: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Page.name) private pageModel: Model<PageDocument>,
    @InjectModel(Faq.name) private faqModel: Model<FaqDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    await this.seedSuperadmin();
    await this.seedProducts();
    await this.seedFaqs();
    await this.seedSettings();
    await this.seedPages();
    this.logger.log('Seed complete');
  }

  private async seedSuperadmin() {
    const count = await this.userModel.countDocuments();
    if (count > 0) return;

    const email =
      this.config.get<string>('SEED_ADMIN_EMAIL') || 'kjoeldewan@gmail.com';
    const password =
      this.config.get<string>('SEED_ADMIN_PASSWORD') || 'RotaveAdmin2026!';
    const passwordHash = await bcrypt.hash(password, 10);

    await this.userModel.create({
      email: email.toLowerCase(),
      name: 'Super Admin',
      passwordHash,
      role: Role.SUPERADMIN,
      isActive: true,
    });
    this.logger.log(`Seeded superadmin: ${email}`);
  }

  private async seedProducts() {
    const count = await this.productModel.countDocuments();
    if (count > 0) return;

    await this.productModel.insertMany([
      {
        name: 'Rotave Moringa',
        slug: 'rotave-moringa',
        description: 'Premium Moringa Leaf Powder',
        price: 28000,
        size: '200g',
        badge: 'OUR FIRST PRODUCT',
        benefits: ['Energy', 'Immunity', 'Skin Health', 'Wellness'],
        images: ['/images/shop/featured_product_photo.jpg'],
        isFeatured: true,
        isComingSoon: false,
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Moringa Capsules',
        slug: 'moringa-capsules',
        description: 'Convenient daily moringa capsules — coming soon.',
        price: 0,
        size: '',
        badge: 'Coming Soon',
        benefits: [],
        images: ['/images/shop/coming_soon_capsules.jpg'],
        isFeatured: false,
        isComingSoon: true,
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Botanical Blends',
        slug: 'botanical-blends',
        description: 'Curated herbal blends for everyday wellness — coming soon.',
        price: 0,
        size: '',
        badge: 'Coming Soon',
        benefits: [],
        images: ['/images/shop/coming_soon_botanical_blend.jpg'],
        isFeatured: false,
        isComingSoon: true,
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Wellness Infusions',
        slug: 'wellness-infusions',
        description: 'Soothing botanical infusions — coming soon.',
        price: 0,
        size: '',
        badge: 'Coming Soon',
        benefits: [],
        images: ['/images/shop/coming_soon_infusion.jpg'],
        isFeatured: false,
        isComingSoon: true,
        isActive: true,
        sortOrder: 4,
      },
    ]);
    this.logger.log('Seeded products');
  }

  private async seedFaqs() {
    const count = await this.faqModel.countDocuments();
    if (count > 0) return;

    await this.faqModel.insertMany([
      {
        question: 'What is Rotave Moringa?',
        answer:
          'Rotave Moringa is a premium leaf powder made from carefully harvested moringa leaves, packed with nutrients to support energy, immunity, and overall wellness.',
        sortOrder: 1,
        isActive: true,
      },
      {
        question: 'How do I use the moringa powder?',
        answer:
          'Add one teaspoon to smoothies, juices, yoghurt, or warm water. Start with a small amount and adjust to your taste.',
        sortOrder: 2,
        isActive: true,
      },
      {
        question: 'Where do you ship?',
        answer:
          'We currently fulfill orders across Nigeria. After you submit an order request, our team will contact you to confirm delivery details.',
        sortOrder: 3,
        isActive: true,
      },
      {
        question: 'How do I place an order?',
        answer:
          'Browse the shop, add items to your cart, and submit an order request. We will reach out to confirm payment and delivery.',
        sortOrder: 4,
        isActive: true,
      },
      {
        question: 'Is your moringa organic?',
        answer:
          'Our moringa is sourced with care from trusted growers who prioritize clean cultivation practices. Reach out for the latest sourcing details.',
        sortOrder: 5,
        isActive: true,
      },
    ]);
    this.logger.log('Seeded FAQs');
  }

  private async seedSettings() {
    const existing = await this.settingsModel.findOne({ key: 'singleton' });
    if (existing) return;

    await this.settingsModel.create({
      key: 'singleton',
      socialLinks: {
        instagram: '',
        facebook: '',
        twitter: '',
        tiktok: '',
        youtube: '',
        linkedin: '',
      },
      notifyEmail:
        this.config.get<string>('ADMIN_NOTIFY_EMAIL') ||
        'kjoeldewan@gmail.com',
      brandName: 'Rotave Wellness',
      brandTagline: 'Rooted in nature. Grown for wellness.',
      brandDescription:
        'Rotave Wellness brings premium botanical products rooted in African heritage.',
    });
    this.logger.log('Seeded settings');
  }

  private async seedPages() {
    const keys = Object.values(PageKey);
    for (const key of keys) {
      const existing = await this.pageModel.findOne({ key });
      if (!existing) {
        await this.pageModel.updateOne(
          { key },
          {
            $setOnInsert: {
              key,
              sections: {},
              updatedBy: null,
            },
          },
          { upsert: true },
        );
      } else if (
        existing.sections === undefined ||
        existing.sections === null
      ) {
        await this.pageModel.updateOne(
          { key },
          { $set: { sections: {} } },
        );
      }
    }
    this.logger.log('Seeded page documents');
  }
}
