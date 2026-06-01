import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import * as express from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const authResult = await this.authService.login(req.user);

    response.cookie('access_token', authResult.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });

    return authResult;
  }

  @Post('verify')
  async verify(@Body('token') token: string, @Body('email') email: string) {
    return this.authService.verifyAccount(email, token);
  }

  @Post('resend-verification')
  async resend(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: any,
    @Res({ passthrough: true }) response: express.Response,
  ) {
    const jti = user?.jti;
    const exp = user?.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = typeof exp === 'number' ? exp - now : 3600;
    if (jti) {
      await this.authService.blockToken(jti, ttl);
    }
    response.clearCookie('access_token');
    if (user?.id) {
      await this.authService.revokeSession(user.id);
    }
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
