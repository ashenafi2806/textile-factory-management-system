import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mysql from 'mysql2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(adapter: any) {
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to database via Driver Adapter');
    } catch (e) {
      console.error('Prisma connection error during onModuleInit:', e);
    }
  }
}
