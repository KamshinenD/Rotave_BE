import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { Role } from '../common/enums/role.enum';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminRequestOtpDto, AdminVerifyOtpDto } from './dto/admin-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.createCustomer(dto);
    Promise.resolve()
      .then(() =>
        this.mailService.sendWelcomeCustomer(user.email, user.name),
      )
      .catch(() => undefined);
    return this.issueToken(user);
  }

  /** Customer (password) login */
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      throw new ForbiddenException(
        'Admin accounts sign in via OTP at /admin/login',
      );
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueToken(user);
  }

  /** Admin step 1: email → OTP emailed */
  async requestAdminOtp(dto: AdminRequestOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (
      !user ||
      !user.isActive ||
      (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN)
    ) {
      throw new UnauthorizedException(
        'You are not registered as an admin',
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await this.usersService.setOtp(user._id.toString(), otp, expiresAt);

    // Fire-and-forget so the API responds quickly
    Promise.resolve()
      .then(() => this.mailService.sendAdminOtp(user.email, user.name, otp))
      .catch(() => undefined);

    return {
      message: 'A 6-digit login code has been sent to your email.',
      email: user.email,
    };
  }

  /** Admin step 2: verify OTP → JWT */
  async verifyAdminOtp(dto: AdminVerifyOtpDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (
      !user ||
      !user.isActive ||
      (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN)
    ) {
      throw new UnauthorizedException('Admin not found');
    }

    const code = (dto.otp || '').trim();
    if (!user.otp || user.otp !== code) {
      throw new UnauthorizedException('Invalid OTP');
    }
    if (user.otpExpiresAt && user.otpExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearOtp(user._id.toString());
      throw new UnauthorizedException('OTP has expired. Request a new code.');
    }

    await this.usersService.clearOtp(user._id.toString());
    return this.issueToken(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }
    return this.usersService.sanitize(user);
  }

  private issueToken(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user: this.usersService.sanitize(user),
    };
  }
}
