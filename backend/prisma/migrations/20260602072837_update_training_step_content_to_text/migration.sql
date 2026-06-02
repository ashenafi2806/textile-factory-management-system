/*
  Warnings:

  - A unique constraint covering the columns `[courseId,stepOrder]` on the table `TrainingStep` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `TrainingStep` MODIFY `content` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `TrainingStep_courseId_stepOrder_key` ON `TrainingStep`(`courseId`, `stepOrder`);
