-- Training system tables

CREATE TABLE IF NOT EXISTS `TrainingMaterial` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `fileUrl` VARCHAR(191) NOT NULL,
  `category` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TrainingCourse` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `category` VARCHAR(191) NOT NULL,
  `isRequired` BOOLEAN NOT NULL DEFAULT false,
  `orderIndex` INTEGER NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TrainingStep` (
  `id` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `stepOrder` INTEGER NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `content` TEXT NULL,
  `videoUrl` VARCHAR(191) NULL,
  `fileUrl` VARCHAR(191) NULL,
  `requiresConfirmation` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `TrainingStep_courseId_stepOrder_key`(`courseId`, `stepOrder`),
  CONSTRAINT `TrainingStep_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `TrainingCourse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TrainingEnrollment` (
  `id` VARCHAR(191) NOT NULL,
  `workerId` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'NOT_STARTED',
  `currentStepIndex` INTEGER NOT NULL DEFAULT 0,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3) NULL,
  `progress` DOUBLE NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `TrainingEnrollment_workerId_courseId_key`(`workerId`, `courseId`),
  CONSTRAINT `TrainingEnrollment_workerId_fkey` FOREIGN KEY (`workerId`) REFERENCES `WorkerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TrainingEnrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `TrainingCourse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `TrainingStepCompletion` (
  `id` VARCHAR(191) NOT NULL,
  `enrollmentId` VARCHAR(191) NOT NULL,
  `stepId` VARCHAR(191) NOT NULL,
  `completedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `notes` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `TrainingStepCompletion_enrollmentId_stepId_key`(`enrollmentId`, `stepId`),
  CONSTRAINT `TrainingStepCompletion_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `TrainingEnrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TrainingStepCompletion_stepId_fkey` FOREIGN KEY (`stepId`) REFERENCES `TrainingStep`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
