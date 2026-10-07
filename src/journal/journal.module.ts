import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JournalPost, JournalPostSchema } from './schemas/journal-post.schema';
import { JournalService } from './journal.service';
import { JournalController } from './journal.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: JournalPost.name, schema: JournalPostSchema },
    ]),
  ],
  controllers: [JournalController],
  providers: [JournalService],
  exports: [JournalService, MongooseModule],
})
export class JournalModule {}
