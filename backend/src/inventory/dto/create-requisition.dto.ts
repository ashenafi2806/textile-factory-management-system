export class CreateRequisitionDto {
  itemId: string;
  quantityRequested: number;
  purpose: string;
  referenceId?: string;
}
