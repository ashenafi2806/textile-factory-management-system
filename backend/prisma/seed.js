"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}
const prisma = new client_1.PrismaClient({
    adapter: new adapter_mariadb_1.PrismaMariaDb(databaseUrl),
});
async function main() {
    const roles = [
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
    const hrAdminPassword = await bcrypt.hash('hradmin123', 10);
    await prisma.user.upsert({
        where: { email: 'hr.admin@tfms.com' },
        update: {},
        create: {
            email: 'hr.admin@tfms.com',
            username: 'hr_admin',
            password: hrAdminPassword,
            isVerified: true,
            mustChangePassword: false,
            roles: {
                connect: [{ name: 'HR_ADMIN' }],
            },
        },
    });
    const managerPassword = await bcrypt.hash('manager123', 10);
    await prisma.user.upsert({
        where: { email: 'manager@tfms.com' },
        update: {},
        create: {
            email: 'manager@tfms.com',
            username: 'manager',
            password: managerPassword,
            isVerified: true,
            mustChangePassword: false,
            roles: {
                connect: [{ name: 'MANAGER' }],
            },
        },
    });
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
    const maintTechPassword = await bcrypt.hash('mainttech123', 10);
    await prisma.user.upsert({
        where: { email: 'maintenance.tech@tfms.com' },
        update: {},
        create: {
            email: 'maintenance.tech@tfms.com',
            username: 'maint_tech',
            password: maintTechPassword,
            isVerified: true,
            mustChangePassword: false,
            roles: {
                connect: [{ name: 'MAINTENANCE_TECHNICIAN' }],
            },
        },
    });
    console.log('✓ Users seeded');
    const inventoryItemsData = [
        {
            name: 'Cotton Fabric - White',
            sku: 'COTTON-WH-001',
            category: client_1.InventoryCategory.RAW_MATERIAL,
            quantity: 5000,
            unit: 'meters',
            minThreshold: 500,
            supplier: 'Fabric Supply Co.',
            location: 'Warehouse A, Row 1',
        },
        {
            name: 'Cotton Fabric - Black',
            sku: 'COTTON-BK-001',
            category: client_1.InventoryCategory.RAW_MATERIAL,
            quantity: 3000,
            unit: 'meters',
            minThreshold: 300,
            supplier: 'Fabric Supply Co.',
            location: 'Warehouse A, Row 2',
        },
        {
            name: 'Polyester Thread - White',
            sku: 'THREAD-WH-001',
            category: client_1.InventoryCategory.RAW_MATERIAL,
            quantity: 10000,
            unit: 'meters',
            minThreshold: 1000,
            supplier: 'Thread Industries',
            location: 'Warehouse B, Shelf 1',
        },
        {
            name: 'Polyester Thread - Black',
            sku: 'THREAD-BK-001',
            category: client_1.InventoryCategory.RAW_MATERIAL,
            quantity: 8000,
            unit: 'meters',
            minThreshold: 800,
            supplier: 'Thread Industries',
            location: 'Warehouse B, Shelf 2',
        },
        {
            name: 'Buttons - White (Small)',
            sku: 'BTN-WH-S-001',
            category: client_1.InventoryCategory.ACCESSORY,
            quantity: 5000,
            unit: 'pieces',
            minThreshold: 500,
            supplier: 'Accessory World',
            location: 'Warehouse C, Bin 12',
        },
        {
            name: 'Buttons - Black (Small)',
            sku: 'BTN-BK-S-001',
            category: client_1.InventoryCategory.ACCESSORY,
            quantity: 4500,
            unit: 'pieces',
            minThreshold: 450,
            supplier: 'Accessory World',
            location: 'Warehouse C, Bin 13',
        },
        {
            name: 'Zippers - 20cm (White)',
            sku: 'ZIP-20-WH-001',
            category: client_1.InventoryCategory.ACCESSORY,
            quantity: 2000,
            unit: 'pieces',
            minThreshold: 200,
            supplier: 'Zipper Tech',
            location: 'Warehouse C, Bin 20',
        },
        {
            name: 'Zippers - 20cm (Black)',
            sku: 'ZIP-20-BK-001',
            category: client_1.InventoryCategory.ACCESSORY,
            quantity: 1800,
            unit: 'pieces',
            minThreshold: 180,
            supplier: 'Zipper Tech',
            location: 'Warehouse C, Bin 21',
        },
        {
            name: 'Labels - Size S',
            sku: 'LBL-S-001',
            category: client_1.InventoryCategory.ACCESSORY,
            quantity: 10000,
            unit: 'pieces',
            minThreshold: 1000,
            supplier: 'Label Printers',
            location: 'Warehouse D, Shelf 5',
        },
        {
            name: 'Labels - Size M',
            sku: 'LBL-M-001',
            category: client_1.InventoryCategory.ACCESSORY,
            quantity: 10000,
            unit: 'pieces',
            minThreshold: 1000,
            supplier: 'Label Printers',
            location: 'Warehouse D, Shelf 6',
        },
        {
            name: 'Packaging Box - Medium',
            sku: 'BOX-M-001',
            category: client_1.InventoryCategory.ACCESSORY,
            quantity: 2000,
            unit: 'pieces',
            minThreshold: 200,
            supplier: 'Packaging Solutions',
            location: 'Warehouse E, Pallet 1',
        },
        {
            name: 'Spare Parts - Sewing Machine Needle',
            sku: 'SP-NEEDLE-001',
            category: client_1.InventoryCategory.SPARE_PART,
            quantity: 500,
            unit: 'pieces',
            minThreshold: 100,
            supplier: 'Machine Parts Inc.',
            location: 'Maintenance Room, Drawer 1',
        },
        {
            name: 'Spare Parts - Cutting Blade',
            sku: 'SP-BLADE-001',
            category: client_1.InventoryCategory.SPARE_PART,
            quantity: 50,
            unit: 'pieces',
            minThreshold: 10,
            supplier: 'Machine Parts Inc.',
            location: 'Maintenance Room, Drawer 2',
        },
    ];
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
    const productionDept = await prisma.department.upsert({
        where: { name: 'Production' },
        update: {},
        create: {
            name: 'Production',
            description: 'Main production department',
        },
    });
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
    if (prodManager && supervisor) {
        const getInventoryItem = (sku) => {
            const item = inventoryMap.get(sku);
            if (!item) {
                throw new Error(`Inventory item with SKU ${sku} not found`);
            }
            return item;
        };
        const buildSeedOrderNumber = (suffix) => `PO-${new Date().getFullYear()}-${Date.now().toString().slice(-8)}-${suffix}`;
        const sampleOrder = await prisma.productionOrder.create({
            data: {
                orderNumber: buildSeedOrderNumber('A'),
                productName: 'Classic White T-Shirt',
                productCode: 'TS-WH-001',
                targetQuantity: 500,
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                status: client_1.ProductionOrderStatus.PLANNED,
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
                            stageName: client_1.ProductionStageName.CUTTING,
                            stageOrder: 1,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                        {
                            stageName: client_1.ProductionStageName.SEWING,
                            stageOrder: 2,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                        {
                            stageName: client_1.ProductionStageName.FINISHING,
                            stageOrder: 3,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                        {
                            stageName: client_1.ProductionStageName.PACKING,
                            stageOrder: 4,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                    ],
                },
            },
            include: {
                bomItems: true,
                stages: true,
            },
        });
        console.log(`✓ Created sample production order: ${sampleOrder.orderNumber}`);
        const sampleOrder2 = await prisma.productionOrder.create({
            data: {
                orderNumber: buildSeedOrderNumber('B'),
                productName: 'Classic Black T-Shirt',
                productCode: 'TS-BK-001',
                targetQuantity: 300,
                deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
                status: client_1.ProductionOrderStatus.PLANNED,
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
                            stageName: client_1.ProductionStageName.CUTTING,
                            stageOrder: 1,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                        {
                            stageName: client_1.ProductionStageName.SEWING,
                            stageOrder: 2,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                        {
                            stageName: client_1.ProductionStageName.FINISHING,
                            stageOrder: 3,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                        {
                            stageName: client_1.ProductionStageName.PACKING,
                            stageOrder: 4,
                            status: client_1.ProductionStageStatus.PENDING,
                        },
                    ],
                },
            },
            include: {
                bomItems: true,
                stages: true,
            },
        });
        console.log(`✓ Created second sample production order: ${sampleOrder2.orderNumber}`);
    }
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
    const qualityThresholds = [
        {
            stageName: client_1.ProductionStageName.CUTTING,
            maxDefectsPerHundred: 3,
            acceptanceCriteria: 'Allow up to 3 defects per 100 units',
        },
        {
            stageName: client_1.ProductionStageName.SEWING,
            maxDefectsPerHundred: 2,
            acceptanceCriteria: 'Allow up to 2 defects per 100 units',
        },
        {
            stageName: client_1.ProductionStageName.FINISHING,
            maxDefectsPerHundred: 1,
            acceptanceCriteria: 'Allow up to 1 defect per 100 units',
        },
        {
            stageName: client_1.ProductionStageName.PACKING,
            maxDefectsPerHundred: 2,
            acceptanceCriteria: 'Allow up to 2 defects per 100 units',
        },
    ];
    try {
        for (const threshold of qualityThresholds) {
            await prisma.qualityThreshold.upsert({
                where: { stageName: threshold.stageName },
                update: {
                    maxDefectsPerHundred: threshold.maxDefectsPerHundred,
                    acceptanceCriteria: threshold.acceptanceCriteria,
                    isActive: true,
                },
                create: {
                    ...threshold,
                    isActive: true,
                },
            });
        }
        console.log('✓ Quality thresholds seeded');
    }
    catch (error) {
        console.warn('⚠ Quality thresholds were skipped because the table is not available yet. Run the Prisma migration first.');
    }
    console.log('\n✅ Seeding finished successfully!');
    console.log('\n=== Login Credentials ===');
    console.log('Admin: admin@tfms.com / admin123');
    console.log('Production Manager: production.manager@tfms.com / manager123');
    console.log('Production Supervisor: production.supervisor@tfms.com / supervisor123');
    console.log('QA Manager: qa.manager@tfms.com / qamanager123');
    console.log('QA Staff: qa.staff@tfms.com / qastaff123');
    console.log('Storekeeper: storekeeper@tfms.com / storekeeper123');
    console.log('Maintenance Manager: maintenance.manager@tfms.com / maintenance123');
    console.log('Workers: worker1@tfms.com, worker2@tfms.com, worker3@tfms.com, worker4@tfms.com / worker123');
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
//# sourceMappingURL=seed.js.map