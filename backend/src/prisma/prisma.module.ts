import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: (configService: ConfigService) => {
        const adapter = new PrismaMariaDb(
          configService.get<string>('DATABASE_URL')!,
        );
        return new PrismaService(adapter);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
