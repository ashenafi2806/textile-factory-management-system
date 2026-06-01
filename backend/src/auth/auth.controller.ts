import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import * as express from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import {
  VerifyAccountDto,
  ResendVerificationDto,
} from './dto/verify-account.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Authenticated', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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

  @ApiOperation({ summary: 'Verify a new account using the emailed token' })
  @ApiBody({ type: VerifyAccountDto })
  @ApiResponse({ status: 201, description: 'Account verified' })
  @ApiResponse({ status: 400, description: 'Invalid token or email' })
  @Post('verify')
  async verify(@Body() body: VerifyAccountDto) {
    return this.authService.verifyAccount(body.email, body.token);
  }

  @ApiOperation({ summary: 'Resend verification email' })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 201, description: 'Verification email sent' })
  @Post('resend-verification')
  async resend(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Log out the current user and clear the session cookie' })
  @ApiResponse({ status: 201, description: 'Logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: 'Get the currently authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
