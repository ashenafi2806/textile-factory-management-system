/*
  Warnings:

  - You are about to drop the column `priority` on the `ProductionOrder` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `ProductionOrder` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `ProductionOrder` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Enum(EnumId(3))`.
  - You are about to drop the column `defectCount` on the `ProductionOutput` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `ProductionOutput` table. All the data in the column will be lost.
  - You are about to drop the column `recordedById` on the `ProductionOutput` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ProductionStage` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `ProductionStage` table. All the data in the column will be lost.
  - You are about to drop the column `sequence` on the `ProductionStage` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `ProductionStage` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(5))`.
  - Added the required column `createdByManagerId` to the `ProductionOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productCode` to the `ProductionOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetQuantity` to the `ProductionOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `goodQuantity` to the `ProductionOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productionOrderId` to the `ProductionOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shiftDate` to the `ProductionOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supervisorId` to the `ProductionOutput` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productionOrderId` to the `ProductionStage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageName` to the `ProductionStage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stageOrder` to the `ProductionStage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ProductionOutput` DROP FOREIGN KEY `ProductionOutput_recordedById_fkey`;

-- DropForeignKey
ALTER TABLE `ProductionOutput` DROP FOREIGN KEY `ProductionOutput_stageId_fkey`;

-- DropForeignKey
ALTER TABLE `ProductionStage` DROP FOREIGN KEY `ProductionStage_orderId_fkey`;

-- DropIndex
DROP INDEX `ProductionOutput_recordedById_fkey` ON `ProductionOutput`;

-- DropIndex
DROP INDEX `ProductionOutput_stageId_fkey` ON `ProductionOutput`;

-- DropIndex
DROP INDEX `ProductionStage_orderId_fkey` ON `ProductionStage`;

-- AlterTable
ALTER TABLE `ProductionOrder` DROP COLUMN `priority`,
    DROP COLUMN `quantity`,
    ADD COLUMN `assignedSupervisorId` VARCHAR(191) NULL,
    ADD COLUMN `createdByManagerId` VARCHAR(191) NOT NULL,
    ADD COLUMN `currentStage` VARCHAR(191) NULL,
    ADD COLUMN `productCode` VARCHAR(191) NOT NULL,
    ADD COLUMN `targetQuantity` INTEGER NOT NULL,
    MODIFY `status` ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'STOPPED', 'CANCELLED') NOT NULL DEFAULT 'PLANNED';

-- AlterTable
ALTER TABLE `ProductionOutput` DROP COLUMN `defectCount`,
    DROP COLUMN `quantity`,
    DROP COLUMN `recordedById`,
    ADD COLUMN `defectiveQuantity` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `goodQuantity` INTEGER NOT NULL,
    ADD COLUMN `productionOrderId` VARCHAR(191) NOT NULL,
    ADD COLUMN `shiftDate` DATETIME(3) NOT NULL,
    ADD COLUMN `supervisorId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `ProductionStage` DROP COLUMN `name`,
    DROP COLUMN `orderId`,
    DROP COLUMN `sequence`,
    ADD COLUMN `completedAt` DATETIME(3) NULL,
    ADD COLUMN `productionOrderId` VARCHAR(191) NOT NULL,
    ADD COLUMN `stageName` ENUM('CUTTING', 'SEWING', 'FINISHING', 'PACKING') NOT NULL,
    ADD COLUMN `stageOrder` INTEGER NOT NULL,
    ADD COLUMN `startedAt` DATETIME(3) NULL,
    MODIFY `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'QA_PENDING', 'QA_APPROVED', 'QA_REJECTED') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `BOMItem` (
    `id` VARCHAR(191) NOT NULL,
    `productionOrderId` VARCHAR(191) NOT NULL,
    `materialId` VARCHAR(191) NOT NULL,
    `requiredQuantity` DOUBLE NOT NULL,
    `unit` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductionIssue` (
    `id` VARCHAR(191) NOT NULL,
    `productionOrderId` VARCHAR(191) NOT NULL,
    `stageId` VARCHAR(191) NULL,
    `reportedById` VARCHAR(191) NOT NULL,
    `issueType` ENUM('MACHINE_FAILURE', 'MATERIAL_SHORTAGE', 'OTHER') NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `priority` ENUM('NORMAL', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductionOrder` ADD CONSTRAINT `ProductionOrder_assignedSupervisorId_fkey` FOREIGN KEY (`assignedSupervisorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionOrder` ADD CONSTRAINT `ProductionOrder_createdByManagerId_fkey` FOREIGN KEY (`createdByManagerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BOMItem` ADD CONSTRAINT `BOMItem_productionOrderId_fkey` FOREIGN KEY (`productionOrderId`) REFERENCES `ProductionOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BOMItem` ADD CONSTRAINT `BOMItem_materialId_fkey` FOREIGN KEY (`materialId`) REFERENCES `InventoryItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionStage` ADD CONSTRAINT `ProductionStage_productionOrderId_fkey` FOREIGN KEY (`productionOrderId`) REFERENCES `ProductionOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionOutput` ADD CONSTRAINT `ProductionOutput_productionOrderId_fkey` FOREIGN KEY (`productionOrderId`) REFERENCES `ProductionOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionOutput` ADD CONSTRAINT `ProductionOutput_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ProductionStage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionOutput` ADD CONSTRAINT `ProductionOutput_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionIssue` ADD CONSTRAINT `ProductionIssue_productionOrderId_fkey` FOREIGN KEY (`productionOrderId`) REFERENCES `ProductionOrder`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionIssue` ADD CONSTRAINT `ProductionIssue_stageId_fkey` FOREIGN KEY (`stageId`) REFERENCES `ProductionStage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionIssue` ADD CONSTRAINT `ProductionIssue_reportedById_fkey` FOREIGN KEY (`reportedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
