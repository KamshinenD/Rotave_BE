import { IsObject } from 'class-validator';

export class UpdatePageDto {
  @IsObject()
  sections: Record<string, unknown>;
}
