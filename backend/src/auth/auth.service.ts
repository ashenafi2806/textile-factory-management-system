/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (isMatch) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const jti = randomUUID();
    const payload = {
      username: user.username,
      email: user.email,
      sub: user.id,
      roles: user.roles.map((r: any) => r.name),
    };
    const access_token = this.jwtService.sign(payload, { jwtid: jti, expiresIn: '1h' });

    // Store session in Redis for 1 hour when available
    try {
      await this.redis.set(`session:user:${user.id}`, jti, 'EX', 3600);
      await this.redis.set(`session:jti:${jti}`, 'active', 'EX', 3600);
    } catch (error) {
      console.warn('Redis session write failed; continuing without session cache.', error);
    }

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles.map((r: any) => r.name),
      },
    };
  }

  async revokeSession(userId: string) {
    const jti = await this.redis.get(`session:user:${userId}`);
    if (jti) {
      await this.redis.del(`session:jti:${jti}`);
    }
    await this.redis.del(`session:user:${userId}`);
  }

  async blockToken(jti: string, ttlSeconds: number) {
    if (!jti || ttlSeconds <= 0) {
      return;
    }
    await this.redis.set(`blocklist:${jti}`, '1', 'EX', ttlSeconds);
  }

  async verifyAccount(email: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, verificationToken: true, isVerified: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid verification request');
    }

    if (user.isVerified) {
      return { message: 'Account already verified' };
    }

    if (!user.verificationToken || user.verificationToken !== token) {
      throw new UnauthorizedException('Verification token is invalid');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        mustChangePassword: false,
      },
    });

    return { message: 'Account verified successfully' };
  }

  async resendVerification(email: string) {
    const token = randomUUID().split('-')[0].toUpperCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException('Account not found');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token },
    });

    console.log(`[EMAIL SIMULATION] Resending verification to ${email}: ${token}`);
    return { message: 'Verification email resent', token };
  }
}
