export class CreateProductionOrderDto {
  productName: string;
  productCode: string;
  targetQuantity: number;
  deadline: string;
  assignedSupervisorId?: string;
  bomItems?: Array<{
    materialId: string;
    requiredQuantity: number;
    unit: string;
  }>;
}
