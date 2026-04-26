import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as mysql from 'mysql2';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  password: 'password',
  database: 'textile_factory',
});
const adapter = new PrismaMariaDb(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const roles = ['ADMIN', 'MANAGER', 'WORKER'];
  
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
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
    pool.end();
  });
