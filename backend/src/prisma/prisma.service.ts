// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit {
//   constructor() { super(); }

//   async onModuleInit() {
//     try {
//       await this.$connect();
//       console.log('Successfully connected to database');
//     } catch (e) {
//       console.error('Prisma connection error during onModuleInit:', e);
//     }
//   }
// }




import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Pass the database URL string directly to the MariaDB driver adapter
    const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);

    // 2. Inject the adapter object instance into the Prisma Client super-constructor
    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log(
        'Successfully connected to MySQL database using Prisma 7 Core Drivers.',
      );
    } catch (e) {
      console.error('Prisma connection error during onModuleInit:', e);
    }
  }
}
