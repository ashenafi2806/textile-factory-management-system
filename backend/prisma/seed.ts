/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// import { PrismaClient } from '@prisma/client';
// import { PrismaMariaDb } from '@prisma/adapter-mariadb';
// import * as mysql from 'mysql2';
// import * as bcrypt from 'bcrypt';
// import * as dotenv from 'dotenv';

// dotenv.config();

// const databaseUrl = process.env.DATABASE_URL!;
// const adapter = new PrismaMariaDb(databaseUrl);
// const prisma = new PrismaClient({ adapter });

// async function main() {
//   const roles = ['ADMIN', 'HR_ADMIN', 'MANAGER', 'SUPERVISOR', 'WORKER'];

//   for (const roleName of roles) {
//     await prisma.role.upsert({
//       where: { name: roleName as any },
//       update: {},
//       create: { name: roleName as any },
//     });
//   }

//   const adminPassword = await bcrypt.hash('admin123', 10);
//   await prisma.user.upsert({
//     where: { email: 'admin@tfms.com' },
//     update: {},
//     create: {
//       email: 'admin@tfms.com',
//       username: 'admin',
//       password: adminPassword,
//       roles: {
//         connect: [{ name: 'ADMIN' }],
//       },
//     },
//   });

//   console.log('Seeding finished.');
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

import {
  PrismaClient,
  InventoryCategory,
  ProductionStageName,
  RoleType,
} from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL!;
const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ============= SEED ROLES =============
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

  // ============= SEED USERS =============
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

  // Create Production Manager
  const prodManagerPassword = await bcrypt.hash('manager123', 10);
  const prodManager = await prisma.user.upsert({
    where: { email: 'production.manager@tfms.com' },
    update: {},
    create: {
      email: 'production.manager@tfms.com',
      username: 'prod_manager',
      password: prodManagerPassword,
      isVerified: true,
      mustChangePassword: false,
      roles: {
        connect: [{ name: 'PRODUCTION_MANAGER' }],
      },
    },
  });

  // Create Production Supervisor
  const prodSupervisorPassword = await bcrypt.hash('supervisor123', 10);
  const supervisor = await prisma.user.upsert({
    where: { email: 'production.supervisor@tfms.com' },
    update: {},
    create: {
      email: 'production.supervisor@tfms.com',
      username: 'prod_supervisor',
      password: prodSupervisorPassword,
      isVerified: true,
      mustChangePassword: false,
      roles: {
        connect: [{ name: 'PRODUCTION_SUPERVISOR' }],
      },
    },
  });

  // Create QA Manager
  const qaManagerPassword = await bcrypt.hash('qamanager123', 10);
  await prisma.user.upsert({
    where: { email: 'qa.manager@tfms.com' },
    update: {},
    create: {
      email: 'qa.manager@tfms.com',
      username: 'qa_manager',
      password: qaManagerPassword,
      isVerified: true,
      mustChangePassword: false,
      roles: {
        connect: [{ name: 'QA_MANAGER' }],
      },
    },
  });

  // Create QA Staff
  const qaStaffPassword = await bcrypt.hash('qastaff123', 10);
  await prisma.user.upsert({
    where: { email: 'qa.staff@tfms.com' },
    update: {},
    create: {
      email: 'qa.staff@tfms.com',
      username: 'qa_staff',
      password: qaStaffPassword,
      isVerified: true,
      mustChangePassword: false,
      roles: {
        connect: [{ name: 'QA_STAFF' }],
      },
    },
  });

  // Create Storekeeper
  const storekeeperPassword = await bcrypt.hash('storekeeper123', 10);
  await prisma.user.upsert({
    where: { email: 'storekeeper@tfms.com' },
    update: {},
    create: {
      email: 'storekeeper@tfms.com',
      username: 'storekeeper',
      password: storekeeperPassword,
      isVerified: true,
      mustChangePassword: false,
      roles: {
        connect: [{ name: 'STOREKEEPER' }],
      },
    },
  });

  // Create Maintenance Manager
  const maintManagerPassword = await bcrypt.hash('maintenance123', 10);
  await prisma.user.upsert({
    where: { email: 'maintenance.manager@tfms.com' },
    update: {},
    create: {
      email: 'maintenance.manager@tfms.com',
      username: 'maint_manager',
      password: maintManagerPassword,
      isVerified: true,
      mustChangePassword: false,
      roles: {
        connect: [{ name: 'MAINTENANCE_MANAGER' }],
      },
    },
  });

  console.log('✓ Users seeded');

  // ============= SEED INVENTORY ITEMS =============
  const inventoryItemsData = [
    {
      name: 'Cotton Fabric - White',
      sku: 'COTTON-WH-001',
      category: InventoryCategory.RAW_MATERIAL,
      quantity: 5000,
      unit: 'meters',
      minThreshold: 500,
      supplier: 'Fabric Supply Co.',
      location: 'Warehouse A, Row 1',
    },
    {
      name: 'Cotton Fabric - Black',
      sku: 'COTTON-BK-001',
      category: InventoryCategory.RAW_MATERIAL,
      quantity: 3000,
      unit: 'meters',
      minThreshold: 300,
      supplier: 'Fabric Supply Co.',
      location: 'Warehouse A, Row 2',
    },
    {
      name: 'Polyester Thread - White',
      sku: 'THREAD-WH-001',
      category: InventoryCategory.RAW_MATERIAL,
      quantity: 10000,
      unit: 'meters',
      minThreshold: 1000,
      supplier: 'Thread Industries',
      location: 'Warehouse B, Shelf 1',
    },
    {
      name: 'Polyester Thread - Black',
      sku: 'THREAD-BK-001',
      category: InventoryCategory.RAW_MATERIAL,
      quantity: 8000,
      unit: 'meters',
      minThreshold: 800,
      supplier: 'Thread Industries',
      location: 'Warehouse B, Shelf 2',
    },
    {
      name: 'Buttons - White (Small)',
      sku: 'BTN-WH-S-001',
      category: InventoryCategory.ACCESSORY,
      quantity: 5000,
      unit: 'pieces',
      minThreshold: 500,
      supplier: 'Accessory World',
      location: 'Warehouse C, Bin 12',
    },
    {
      name: 'Buttons - Black (Small)',
      sku: 'BTN-BK-S-001',
      category: InventoryCategory.ACCESSORY,
      quantity: 4500,
      unit: 'pieces',
      minThreshold: 450,
      supplier: 'Accessory World',
      location: 'Warehouse C, Bin 13',
    },
    {
      name: 'Zippers - 20cm (White)',
      sku: 'ZIP-20-WH-001',
      category: InventoryCategory.ACCESSORY,
      quantity: 2000,
      unit: 'pieces',
      minThreshold: 200,
      supplier: 'Zipper Tech',
      location: 'Warehouse C, Bin 20',
    },
    {
      name: 'Zippers - 20cm (Black)',
      sku: 'ZIP-20-BK-001',
      category: InventoryCategory.ACCESSORY,
      quantity: 1800,
      unit: 'pieces',
      minThreshold: 180,
      supplier: 'Zipper Tech',
      location: 'Warehouse C, Bin 21',
    },
    {
      name: 'Labels - Size S',
      sku: 'LBL-S-001',
      category: InventoryCategory.ACCESSORY,
      quantity: 10000,
      unit: 'pieces',
      minThreshold: 1000,
      supplier: 'Label Printers',
      location: 'Warehouse D, Shelf 5',
    },
    {
      name: 'Labels - Size M',
      sku: 'LBL-M-001',
      category: InventoryCategory.ACCESSORY,
      quantity: 10000,
      unit: 'pieces',
      minThreshold: 1000,
      supplier: 'Label Printers',
      location: 'Warehouse D, Shelf 6',
    },
    {
      name: 'Packaging Box - Medium',
      sku: 'BOX-M-001',
      category: InventoryCategory.ACCESSORY,
      quantity: 2000,
      unit: 'pieces',
      minThreshold: 200,
      supplier: 'Packaging Solutions',
      location: 'Warehouse E, Pallet 1',
    },
    {
      name: 'Spare Parts - Sewing Machine Needle',
      sku: 'SP-NEEDLE-001',
      category: InventoryCategory.SPARE_PART,
      quantity: 500,
      unit: 'pieces',
      minThreshold: 100,
      supplier: 'Machine Parts Inc.',
      location: 'Maintenance Room, Drawer 1',
    },
    {
      name: 'Spare Parts - Cutting Blade',
      sku: 'SP-BLADE-001',
      category: InventoryCategory.SPARE_PART,
      quantity: 50,
      unit: 'pieces',
      minThreshold: 10,
      supplier: 'Machine Parts Inc.',
      location: 'Maintenance Room, Drawer 2',
    },
  ];

  // Create inventory items and store in a Map for easy lookup
  const inventoryMap = new Map();
  for (const item of inventoryItemsData) {
    const created = await prisma.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
    inventoryMap.set(item.sku, created);
    console.log(`✓ Created inventory item: ${item.name} (${item.sku})`);
  }

  // ============= SEED DEPARTMENTS =============
  const productionDept = await prisma.department.upsert({
    where: { name: 'Production' },
    update: {},
    create: {
      name: 'Production',
      description: 'Main production department',
    },
  });

  // Create teams (using create since upsert with name doesn't work)
  const cuttingTeam = await prisma.team.create({
    data: {
      name: 'Cutting Team',
      departmentId: productionDept.id,
    },
  });

  const sewingTeam = await prisma.team.create({
    data: {
      name: 'Sewing Team',
      departmentId: productionDept.id,
    },
  });

  const finishingTeam = await prisma.team.create({
    data: {
      name: 'Finishing Team',
      departmentId: productionDept.id,
    },
  });

  const packingTeam = await prisma.team.create({
    data: {
      name: 'Packing Team',
      departmentId: productionDept.id,
    },
  });

  console.log('✓ Teams created');

  // Create worker profiles
  const workerPassword = await bcrypt.hash('worker123', 10);

  const workers = [
    {
      username: 'worker1',
      email: 'worker1@tfms.com',
      employeeId: 'EMP001',
      position: 'Cutting Operator',
      teamId: cuttingTeam.id,
    },
    {
      username: 'worker2',
      email: 'worker2@tfms.com',
      employeeId: 'EMP002',
      position: 'Sewing Operator',
      teamId: sewingTeam.id,
    },
    {
      username: 'worker3',
      email: 'worker3@tfms.com',
      employeeId: 'EMP003',
      position: 'Finishing Operator',
      teamId: finishingTeam.id,
    },
    {
      username: 'worker4',
      email: 'worker4@tfms.com',
      employeeId: 'EMP004',
      position: 'Packing Operator',
      teamId: packingTeam.id,
    },
  ];

  for (const worker of workers) {
    const user = await prisma.user.upsert({
      where: { email: worker.email },
      update: {},
      create: {
        email: worker.email,
        username: worker.username,
        password: workerPassword,
        isVerified: true,
        mustChangePassword: false,
        roles: {
          connect: [{ name: 'WORKER' }],
        },
      },
    });

    await prisma.workerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        employeeId: worker.employeeId,
        userId: user.id,
        position: worker.position,
        departmentId: productionDept.id,
        teamId: worker.teamId,
        skillLevel: 'Intermediate',
        joiningDate: new Date(),
      },
    });
  }

  console.log('✓ Worker profiles created');

  // ============= SEED SAMPLE PRODUCTION ORDER =============
  if (prodManager && supervisor) {
    // Helper function to get inventory item by SKU from Map
    const getInventoryItem = (sku: string) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const item = inventoryMap.get(sku);
      if (!item) {
        throw new Error(`Inventory item with SKU ${sku} not found`);
      }
      return item;
    };

    const sampleOrder = await prisma.productionOrder.create({
      data: {
        orderNumber: `PO-${new Date().getFullYear()}-000001`,
        productName: 'Classic White T-Shirt',
        productCode: 'TS-WH-001',
        targetQuantity: 500,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'PLANNED',
        assignedSupervisorId: supervisor.id,
        createdByManagerId: prodManager.id,
        bomItems: {
          create: [
            {
              materialId: getInventoryItem('COTTON-WH-001').id,
              requiredQuantity: 750,
              unit: 'meters',
            },
            {
              materialId: getInventoryItem('THREAD-WH-001').id,
              requiredQuantity: 1500,
              unit: 'meters',
            },
            {
              materialId: getInventoryItem('BTN-WH-S-001').id,
              requiredQuantity: 2500,
              unit: 'pieces',
            },
            {
              materialId: getInventoryItem('LBL-M-001').id,
              requiredQuantity: 500,
              unit: 'pieces',
            },
            {
              materialId: getInventoryItem('BOX-M-001').id,
              requiredQuantity: 500,
              unit: 'pieces',
            },
          ],
        },
        stages: {
          create: [
            {
              stageName: ProductionStageName.CUTTING,
              stageOrder: 1,
              status: 'PENDING',
            },
            {
              stageName: ProductionStageName.SEWING,
              stageOrder: 2,
              status: 'PENDING',
            },
            {
              stageName: ProductionStageName.FINISHING,
              stageOrder: 3,
              status: 'PENDING',
            },
            {
              stageName: ProductionStageName.PACKING,
              stageOrder: 4,
              status: 'PENDING',
            },
          ],
        },
      },
      include: {
        bomItems: true,
        stages: true,
      },
    });

    console.log(
      `✓ Created sample production order: ${sampleOrder.orderNumber}`,
    );

    // Create a second sample order
    const sampleOrder2 = await prisma.productionOrder.create({
      data: {
        orderNumber: `PO-${new Date().getFullYear()}-000002`,
        productName: 'Classic Black T-Shirt',
        productCode: 'TS-BK-001',
        targetQuantity: 300,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'PLANNED',
        assignedSupervisorId: supervisor.id,
        createdByManagerId: prodManager.id,
        bomItems: {
          create: [
            {
              materialId: getInventoryItem('COTTON-BK-001').id,
              requiredQuantity: 450,
              unit: 'meters',
            },
            {
              materialId: getInventoryItem('THREAD-BK-001').id,
              requiredQuantity: 900,
              unit: 'meters',
            },
            {
              materialId: getInventoryItem('BTN-BK-S-001').id,
              requiredQuantity: 1500,
              unit: 'pieces',
            },
          ],
        },
        stages: {
          create: [
            {
              stageName: ProductionStageName.CUTTING,
              stageOrder: 1,
              status: 'PENDING',
            },
            {
              stageName: ProductionStageName.SEWING,
              stageOrder: 2,
              status: 'PENDING',
            },
            {
              stageName: ProductionStageName.FINISHING,
              stageOrder: 3,
              status: 'PENDING',
            },
            {
              stageName: ProductionStageName.PACKING,
              stageOrder: 4,
              status: 'PENDING',
            },
          ],
        },
      },
      include: {
        bomItems: true,
        stages: true,
      },
    });

    console.log(
      `✓ Created second sample production order: ${sampleOrder2.orderNumber}`,
    );
  }

  // ============= SEED SHIFTS =============
  const shifts = [
    { name: 'Morning', startTime: '06:00', endTime: '14:00' },
    { name: 'Afternoon', startTime: '14:00', endTime: '22:00' },
    { name: 'Night', startTime: '22:00', endTime: '06:00' },
  ];

  for (const shift of shifts) {
    await prisma.shift.upsert({
      where: { name: shift.name },
      update: {},
      create: shift,
    });
  }

  console.log('✓ Shifts seeded');
  console.log('\n✅ Seeding finished successfully!');
  console.log('\n=== Login Credentials ===');
  console.log('Admin: admin@tfms.com / admin123');
  console.log('Production Manager: production.manager@tfms.com / manager123');
  console.log(
    'Production Supervisor: production.supervisor@tfms.com / supervisor123',
  );
  console.log('QA Manager: qa.manager@tfms.com / qamanager123');
  console.log('QA Staff: qa.staff@tfms.com / qastaff123');
  console.log('Storekeeper: storekeeper@tfms.com / storekeeper123');
  console.log(
    'Maintenance Manager: maintenance.manager@tfms.com / maintenance123',
  );
  console.log(
    'Workers: worker1@tfms.com, worker2@tfms.com, worker3@tfms.com, worker4@tfms.com / worker123',
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// npx ts-node prisma/seed.ts

// npx prisma db seed
