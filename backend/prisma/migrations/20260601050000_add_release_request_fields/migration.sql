-- Add release-request status enum column on ProductionOrder and FK columns
ALTER TABLE `ProductionOrder`
  ADD COLUMN `releaseRequestStatus` ENUM('NONE','PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'NONE',
  ADD COLUMN `releaseRequestedById` VARCHAR(191) NULL,
  ADD COLUMN `releaseRequestedAt` DATETIME(3) NULL,
  ADD COLUMN `releaseApprovedById` VARCHAR(191) NULL,
  ADD COLUMN `releaseApprovedAt` DATETIME(3) NULL,
  ADD COLUMN `releaseRejectionReason` TEXT NULL;

-- Add foreign keys for the new relation columns
ALTER TABLE `ProductionOrder`
  ADD CONSTRAINT `ProductionOrder_releaseRequestedById_fkey`
    FOREIGN KEY (`releaseRequestedById`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ProductionOrder_releaseApprovedById_fkey`
    FOREIGN KEY (`releaseApprovedById`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Index the request status column for fast filtering
CREATE INDEX `ProductionOrder_releaseRequestStatus_idx`
  ON `ProductionOrder`(`releaseRequestStatus`);
