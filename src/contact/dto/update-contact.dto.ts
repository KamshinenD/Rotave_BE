import { IsBoolean } from 'class-validator';

export class UpdateContactDto {
  @IsBoolean()
  isRead: boolean;
}
