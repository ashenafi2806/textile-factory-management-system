-- AlterTable
ALTER TABLE `WorkerProfile` ADD COLUMN `emergencyContact` VARCHAR(191) NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL,
    ADD COLUMN `salary` DOUBLE NULL,
    ADD COLUMN `skillLevel` VARCHAR(191) NULL;
