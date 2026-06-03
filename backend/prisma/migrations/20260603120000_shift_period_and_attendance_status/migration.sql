-- Shift period + assignment range + attendance status

-- Shift: add period fields, drop unique name
ALTER TABLE `Shift` DROP INDEX `Shift_name_key`;

ALTER TABLE `Shift`
  ADD COLUMN `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `endDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `description` VARCHAR(191) NULL;

-- ShiftAssignment: replace single date with range
ALTER TABLE `ShiftAssignment`
  ADD COLUMN `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `endDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

UPDATE `ShiftAssignment` SET `startDate` = `date`, `endDate` = `date` WHERE `date` IS NOT NULL;

ALTER TABLE `ShiftAssignment` DROP INDEX `ShiftAssignment_shiftId_workerId_date_key`;
ALTER TABLE `ShiftAssignment` DROP COLUMN `date`;
ALTER TABLE `ShiftAssignment` ADD UNIQUE INDEX `ShiftAssignment_shiftId_workerId_startDate_key`(`shiftId`, `workerId`, `startDate`);

-- Attendance: status enum + nullable checkIn/recordedBy
ALTER TABLE `Attendance`
  ADD COLUMN `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE') NOT NULL DEFAULT 'PRESENT';

ALTER TABLE `Attendance` MODIFY `checkIn` DATETIME(3) NULL;
ALTER TABLE `Attendance` MODIFY `recordedById` VARCHAR(191) NULL;

ALTER TABLE `Attendance` ADD UNIQUE INDEX `Attendance_workerId_date_key`(`workerId`, `date`);
