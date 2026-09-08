import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/model/user.model';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenPayload } from './interfaces/token-payload.interface';
import { OtpType } from '../common/enums/otp-type.enum';
import { Role } from '../common/enums/role.enum';
import { generateOtp } from '../common/utils/otp.util';
import { parseDurationToMs } from '../common/utils/time.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      is_super: user.is_super,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
    });
  }

  generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      is_super: user.is_super,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
    });
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify<TokenPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }

  decodeToken(token: string): TokenPayload | null {
    return this.jwtService.decode(token) as TokenPayload | null;
  }

  private async issueTokens(
    user: User,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const access_token = this.generateAccessToken(user);
    const refresh_token = this.generateRefreshToken(user);

    const hashed_refresh_token = await bcrypt.hash(refresh_token, 10);
    await user.update({ hashed_refresh_token });

    return { access_token, refresh_token };
  }


  private async issueOtp(user: User, type: OtpType): Promise<void> {
    const otpLength = Number(this.configService.get<string>('OTP_LENGTH'));
    const otpExpiresIn = this.configService.get<string>('OTP_EXPIRES_IN') as string;

    const otp = generateOtp(otpLength);
    const otp_time = new Date(Date.now() + parseDurationToMs(otpExpiresIn));

    await user.update({ otp, otp_time, otp_type: type });

    const purpose =
      type === OtpType.FORGOT_PASSWORD ? 'FORGOT_PASSWORD' : 'VERIFY_EMAIL';
    await this.mailService.sendOtp(user.email, otp, purpose);
  }

  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const user = await this.usersService.create(dto);
    await this.issueOtp(user, OtpType.VERIFY_EMAIL);

    return {
      message: 'Registration successful. Please check your email for the OTP code.',
      email: user.email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid email or OTP');
    }

    this.assertOtpValid(user, dto.otp, OtpType.VERIFY_EMAIL);

    await user.update({
      is_verified: true,
      otp: null,
      otp_time: null,
      otp_type: null,
    });

    return { message: 'Email verified successfully' };
  }

  private assertOtpValid(user: User, otp: string, expectedType: OtpType): void {
    if (!user.otp || !user.otp_time || !user.otp_type) {
      throw new BadRequestException('OTP not requested or already used');
    }

    if (user.otp_type !== expectedType) {
      throw new BadRequestException('Invalid OTP type');
    }

    if (user.otp !== otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    if (new Date() > new Date(user.otp_time)) {
      throw new BadRequestException('OTP has expired');
    }
  }


  async resendOtp(dto: ResendOtpDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid email');
    }

    if (user.is_verified) {
      throw new BadRequestException('User is already verified');
    }

    await this.issueOtp(user, OtpType.VERIFY_EMAIL);

    return { message: 'A new OTP code has been sent to your email' };
  }


  async login(
    dto: LoginDto,
  ): Promise<{ access_token: string; refresh_token: string; user: User }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.hashed_password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_verified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const tokens = await this.issueTokens(user);

    return { ...tokens, user };
  }


  async refresh(
    dto: RefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    let payload: TokenPayload;

    try {
      payload = this.verifyRefreshToken(dto.refresh_token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userModel.findByPk(payload.sub);

    if (!user || !user.hashed_refresh_token) {
      throw new UnauthorizedException('Access denied');
    }

    const isMatch = await bcrypt.compare(
      dto.refresh_token,
      user.hashed_refresh_token,
    );

    if (!isMatch) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.issueTokens(user);
    return tokens;
  }


  async logout(userId: number): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);
    await user.update({ hashed_refresh_token: null });
    return { message: 'Logged out successfully' };
  }


  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    const genericMessage = {
      message:
        'If an account with this email exists, a password reset code has been sent',
    };

    if (!user) {
      return genericMessage;
    }

    await this.issueOtp(user, OtpType.FORGOT_PASSWORD);
    return genericMessage;
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new BadRequestException('Invalid email or OTP');
    }

    this.assertOtpValid(user, dto.otp, OtpType.FORGOT_PASSWORD);

    const hashed_password = await bcrypt.hash(dto.new_password, 10);

    await user.update({
      hashed_password,
      otp: null,
      otp_time: null,
      otp_type: null,
      hashed_refresh_token: null,
    });

    return { message: 'Password has been reset successfully' };
  }

  async changePassword(
    userId: number,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findOne(userId);

    const isPasswordValid = await bcrypt.compare(
      dto.old_password,
      user.hashed_password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashed_password = await bcrypt.hash(dto.new_password, 10);

    await user.update({
      hashed_password,
      hashed_refresh_token: null,
    });

    return { message: 'Password changed successfully' };
  }


  async ensureSuperAdmin(): Promise<void> {
    const email = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const password = this.configService.get<string>('SUPER_ADMIN_PASSWORD');

    if (!email || !password) {
      return;
    }

    const existing = await this.usersService.findByEmail(email);

    if (existing) {
      if (existing.role !== Role.ADMIN || !existing.is_super) {
        await existing.update({ role: Role.ADMIN, is_super: true, is_verified: true });
      }
      return;
    }

    const hashed_password = await bcrypt.hash(password, 10);

    await this.userModel.create({
      username: 'superadmin',
      email,
      hashed_password,
      age: 18,
      photo: null,
      role: Role.ADMIN,
      is_super: true,
      is_verified: true,
    });
  }
}
