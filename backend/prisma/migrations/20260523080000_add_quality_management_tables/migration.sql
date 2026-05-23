-- CreateTable
CREATE TABLE `QualityThreshold` (
    `id` VARCHAR(191) NOT NULL,
    `stageName` ENUM('CUTTING', 'SEWING', 'FINISHING', 'PACKING') NOT NULL,
    `maxDefectsPerHundred` INTEGER NOT NULL,
    `acceptanceCriteria` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `QualityThreshold_stageName_key`(`stageName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QualityInspection` (
    `id` VARCHAR(191) NOT NULL,
    `productionOrderId` VARCHAR(191) NOT NULL,
    `stageId` VARCHAR(191) NOT NULL,
    `inspectedById` VARCHAR(191) NOT NULL,
    `measurements` LONGTEXT NULL,
    `defects` INTEGER NOT NULL DEFAULT 0,
    `result` VARCHAR(191) NOT NULL,
    `notes` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `QualityThreshold` ADD CONSTRAINT `QualityThreshold_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityInspection` ADD CONSTRAINT `QualityInspection_productionOrderId_fkey` FOREIGN KEY (`productionOrderId`) REFERENCES `ProductionOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityInspection` ADD CONSTRAINT `QualityInspection_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ProductionStage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QualityInspection` ADD CONSTRAINT `QualityInspection_inspectedById_fkey` FOREIGN KEY (`inspectedById`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
