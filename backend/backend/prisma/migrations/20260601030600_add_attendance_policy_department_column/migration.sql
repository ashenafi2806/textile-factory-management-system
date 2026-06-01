-- AlterTable
ALTER TABLE `AttendancePolicy` ADD COLUMN `department` VARCHAR(191) NULL;

-- Backfill department from the related Department table when possible
UPDATE `AttendancePolicy` ap
LEFT JOIN `Department` d ON ap.`departmentId` = d.`id`
SET ap.`department` = d.`name`
WHERE ap.`department` IS NULL AND d.`name` IS NOT NULL;
