-- AlterTable
ALTER TABLE `WorkerProfile` ADD COLUMN `department` VARCHAR(191) NULL;

-- Backfill department from the related Department table when possible
UPDATE `WorkerProfile` wp
LEFT JOIN `Department` d ON wp.`departmentId` = d.`id`
SET wp.`department` = d.`name`
WHERE wp.`department` IS NULL AND d.`name` IS NOT NULL;
