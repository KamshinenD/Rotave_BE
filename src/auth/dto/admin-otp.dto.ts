import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class AdminRequestOtpDto {
  @IsEmail()
  email: string;
}

export class AdminVerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
