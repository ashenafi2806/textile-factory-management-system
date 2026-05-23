-- AlterTable
ALTER TABLE `ProductionStage`
    ADD COLUMN `completedById` VARCHAR(191) NULL,
    ADD COLUMN `reviewedById` VARCHAR(191) NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `ProductionStage`
    ADD CONSTRAINT `ProductionStage_completedById_fkey`
    FOREIGN KEY (`completedById`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductionStage`
    ADD CONSTRAINT `ProductionStage_reviewedById_fkey`
    FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
