import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mysql from 'mysql2';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = ['ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPERVISOR', 'WORKER'];
  
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName as any },
      update: {},
      create: { name: roleName as any },
    });
  }

  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@tfms.com' },
    update: {},
    create: {
      email: 'admin@tfms.com',
      username: 'admin',
      password: adminPassword,
      roles: {
        connect: [{ name: 'ADMIN' }],
      },
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
