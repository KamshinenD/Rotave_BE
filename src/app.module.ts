import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { PagesModule } from './pages/pages.module';
import { OrdersModule } from './orders/orders.module';
import { JournalModule } from './journal/journal.module';
import { FaqModule } from './faq/faq.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { ContactModule } from './contact/contact.module';
import { SettingsModule } from './settings/settings.module';
import { UploadsModule } from './uploads/uploads.module';
import { MailModule } from './mail/mail.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGODB_URI') ||
          'mongodb://127.0.0.1:27017/rotave',
      }),
    }),
    MailModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    PagesModule,
    OrdersModule,
    JournalModule,
    FaqModule,
    NewsletterModule,
    ContactModule,
    SettingsModule,
    UploadsModule,
    SeedModule,
  ],
})
export class AppModule {}
