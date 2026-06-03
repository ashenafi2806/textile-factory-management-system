-- Shift period + assignment range + attendance status

-- Shift: add period fields, drop unique name (idempotent)
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Shift' AND index_name = 'Shift_name_key'
);
SET @sql = IF(@idx_exists > 0, 'ALTER TABLE `Shift` DROP INDEX `Shift_name_key`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'Shift' AND column_name = 'startDate'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `Shift` ADD COLUMN `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), ADD COLUMN `endDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), ADD COLUMN `description` VARCHAR(191) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ShiftAssignment: add range columns
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ShiftAssignment' AND column_name = 'startDate'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `ShiftAssignment` ADD COLUMN `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), ADD COLUMN `endDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @date_col = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ShiftAssignment' AND column_name = 'date'
);
SET @sql = IF(@date_col > 0,
  'UPDATE `ShiftAssignment` SET `startDate` = `date`, `endDate` = `date` WHERE `date` IS NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ensure shiftId is indexed before dropping composite unique (FK may depend on it)
SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'ShiftAssignment' AND index_name = 'ShiftAssignment_shiftId_idx'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `ShiftAssignment` ADD INDEX `ShiftAssignment_shiftId_idx` (`shiftId`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'ShiftAssignment' AND index_name = 'ShiftAssignment_shiftId_workerId_startDate_key'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `ShiftAssignment` ADD UNIQUE INDEX `ShiftAssignment_shiftId_workerId_startDate_key`(`shiftId`, `workerId`, `startDate`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'ShiftAssignment' AND index_name = 'ShiftAssignment_shiftId_workerId_date_key'
);
SET @sql = IF(@idx_exists > 0,
  'ALTER TABLE `ShiftAssignment` DROP INDEX `ShiftAssignment_shiftId_workerId_date_key`',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @date_col = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'ShiftAssignment' AND column_name = 'date'
);
SET @sql = IF(@date_col > 0, 'ALTER TABLE `ShiftAssignment` DROP COLUMN `date`', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Attendance: status enum + nullable checkIn/recordedBy
SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'Attendance' AND column_name = 'status'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE `Attendance` ADD COLUMN `status` ENUM(''PRESENT'', ''ABSENT'', ''LATE'', ''ON_LEAVE'') NOT NULL DEFAULT ''PRESENT''',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `Attendance` MODIFY `checkIn` DATETIME(3) NULL;
ALTER TABLE `Attendance` MODIFY `recordedById` VARCHAR(191) NULL;

SET @idx_exists = (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema = DATABASE() AND table_name = 'Attendance' AND index_name = 'Attendance_workerId_date_key'
);
SET @sql = IF(@idx_exists = 0,
  'ALTER TABLE `Attendance` ADD UNIQUE INDEX `Attendance_workerId_date_key`(`workerId`, `date`)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
