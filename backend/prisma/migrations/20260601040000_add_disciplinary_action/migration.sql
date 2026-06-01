-- Add DisciplinaryAction module (Supervisor spec: "Records ... disciplinary actions")
-- Adds new table and enums only; does NOT touch legacy Department/Team columns.

CREATE TABLE `DisciplinaryAction` (
  `id` VARCHAR(191) NOT NULL,
  `workerId` VARCHAR(191) NOT NULL,
  `category` ENUM('VERBAL_WARNING','WRITTEN_WARNING','SUSPENSION','FINAL_WARNING','TERMINATION','COUNSELING') NOT NULL,
  `severity` ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'LOW',
  `subject` VARCHAR(191) NOT NULL,
  `reason` VARCHAR(191) NULL,
  `notes` VARCHAR(191) NULL,
  `status` ENUM('ISSUED','ACKNOWLEDGED','APPEALED','EXPIRED','REVOKED') NOT NULL DEFAULT 'ISSUED',
  `issuedById` VARCHAR(191) NOT NULL,
  `acknowledgedAt` DATETIME(3) NULL,
  `acknowledgedById` VARCHAR(191) NULL,
  `effectiveDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `expiresAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `DisciplinaryAction_workerId_idx`(`workerId`),
  INDEX `DisciplinaryAction_issuedById_idx`(`issuedById`),
  INDEX `DisciplinaryAction_acknowledgedById_idx`(`acknowledgedById`),
  INDEX `DisciplinaryAction_status_idx`(`status`),
  CONSTRAINT `DisciplinaryAction_workerId_fkey`
    FOREIGN KEY (`workerId`) REFERENCES `WorkerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DisciplinaryAction_issuedById_fkey`
    FOREIGN KEY (`issuedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `DisciplinaryAction_acknowledgedById_fkey`
    FOREIGN KEY (`acknowledgedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
