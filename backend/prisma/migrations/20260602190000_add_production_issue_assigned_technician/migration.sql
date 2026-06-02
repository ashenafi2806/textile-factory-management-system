-- AlterTable
ALTER TABLE `ProductionIssue` ADD COLUMN `assignedTechnicianId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `ProductionIssue` ADD CONSTRAINT `ProductionIssue_assignedTechnicianId_fkey` FOREIGN KEY (`assignedTechnicianId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
