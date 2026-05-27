import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
<<<<<<< HEAD
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
=======
  providers: [PrismaService],
>>>>>>> main
  exports: [PrismaService],
})
export class PrismaModule {}
