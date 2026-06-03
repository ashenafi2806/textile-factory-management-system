-- Maintenance workflow: approval statuses and spare-part deduction flag
ALTER TABLE `maintenance_tasks`
  MODIFY `status` ENUM(
    'OPEN',
    'PENDING_APPROVAL',
    'IN_PROGRESS',
    'PENDING_COMPLETION',
    'COMPLETED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'OPEN';

ALTER TABLE `maintenance_spare_parts`
  ADD COLUMN `deducted` BOOLEAN NOT NULL DEFAULT false;

UPDATE `maintenance_spare_parts` SET `deducted` = true WHERE 1 = 1;
