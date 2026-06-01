/*
  Warnings:

  - You are about to drop the column `departmentId` on the `AttendancePolicy` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `WorkerProfile` table. All the data in the column will be lost.
  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `AttendancePolicy` DROP FOREIGN KEY `AttendancePolicy_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `Team` DROP FOREIGN KEY `Team_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerProfile` DROP FOREIGN KEY `WorkerProfile_departmentId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkerProfile` DROP FOREIGN KEY `WorkerProfile_teamId_fkey`;

-- DropIndex
DROP INDEX `AttendancePolicy_departmentId_fkey` ON `AttendancePolicy`;

-- DropIndex
DROP INDEX `WorkerProfile_departmentId_fkey` ON `WorkerProfile`;

-- DropIndex
DROP INDEX `WorkerProfile_teamId_fkey` ON `WorkerProfile`;

-- AlterTable
ALTER TABLE `AttendancePolicy` DROP COLUMN `departmentId`;

-- AlterTable
ALTER TABLE `InventoryTransaction` MODIFY `referenceType` ENUM('RECEIPT', 'REQUISITION', 'PRODUCTION_ORDER', 'MAINTENANCE_TASK', 'PRODUCTION_ISSUE', 'OTHER') NULL;

-- AlterTable
ALTER TABLE `ProductionIssue` ADD COLUMN `assignedTechnicianId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `WorkerProfile` DROP COLUMN `departmentId`,
    DROP COLUMN `teamId`;

-- DropTable
DROP TABLE `Department`;

-- DropTable
DROP TABLE `Team`;

-- AddForeignKey
ALTER TABLE `ProductionIssue` ADD CONSTRAINT `ProductionIssue_assignedTechnicianId_fkey` FOREIGN KEY (`assignedTechnicianId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
