import { PrismaClient, RoleType } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb(databaseUrl),
});

async function main() {
  const roles: RoleType[] = [
    'ADMIN',
    'HR_ADMIN',
    'MANAGER',
    'SUPERVISOR',
    'WORKER',
    'STOREKEEPER',
    'PRODUCTION_MANAGER',
    'PRODUCTION_SUPERVISOR',
    'MAINTENANCE_MANAGER',
    'MAINTENANCE_TECHNICIAN',
    'QA_MANAGER',
    'QA_STAFF',
  ];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  console.log('✓ Roles seeded');

  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@tfms.com' },
    update: {},
    create: {
      email: 'admin@tfms.com',
      username: 'admin',
      password: adminPassword,
      isVerified: true,
      mustChangePassword: false,
      roles: {
        connect: [{ name: 'ADMIN' }],
      },
    },
  });

  console.log('✓ Users seeded');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
