export class ProductionOrder {
    id: string;
    productName: string;
    productCode: string;
    targetQuantity: number;
    deadline: string;
    assignedSupervisorId: string;
    bomItems: Array<{ materialId: string; requiredQuantity: number; unit: string; }>;
    status: string; 
    createdAt: Date;
    updatedAt: Date;
}
