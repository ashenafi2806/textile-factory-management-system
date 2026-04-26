import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @Inject('REDIS_CLIENT') private redis: Redis,
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
    const payload = { email: user.email, sub: user.id, roles: user.roles.map((r: any) => r.name) };
    const access_token = this.jwtService.sign(payload);
    
    // Store session in Redis for 1 hour
    await this.redis.set(`session:${user.id}`, access_token, 'EX', 3600);
    
    return { access_token };
  }

  async revokeSession(userId: string) {
    await this.redis.del(`session:${userId}`);
  }
}
