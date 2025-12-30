import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email.toLowerCase(), dto.password, dto.name);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email.toLowerCase(), dto.password);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  // Option: revoke one token (if provided) OR revoke all for current user (requires access token)
  @Post('logout')
  async logout(@Body() dto: LogoutDto, @Req() req: any) {
    if (dto.refreshToken) {
      return this.auth.logoutOne(dto.refreshToken);
    }

    // If no refresh token provided, require access token and revoke all
    if (!req.user?.userId) {
      // don’t reveal too much; require the safer path
      return { ok: true };
    }
    return this.auth.logoutAll(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return { userId: req.user.userId, email: req.user.email };
  }
}
