import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { PagesModule } from '../pages/pages.module';
import { FaqModule } from '../faq/faq.module';
import { SettingsModule } from '../settings/settings.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    PagesModule,
    FaqModule,
    SettingsModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
