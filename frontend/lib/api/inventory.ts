import api from "./client";

export type InventoryCategory =
  | "RAW_MATERIAL"
  | "SPARE_PART"
  | "ACCESSORY"
  | "FINISHED_GOOD";

export type TransactionType = "RESTOCK" | "ISSUE" | "ADJUSTMENT" | "RETURN";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  minThreshold: number;
  supplier?: string | null;
  location?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: TransactionType;
  quantity: number;
  performedById: string;
  referenceId?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface TransactionWithDetails extends InventoryTransaction {
  item: {
    name: string;
    sku: string;
    unit: string;
  };
  performedBy: {
    username: string;
    email: string;
  };
  // for ISSUE transactions, backend may include returnedQuantity
  returnedQuantity?: number;
}

export interface AlertItem extends InventoryItem {
  shortage: number;
  severity: "critical" | "warning";
  suggestedReorderQuantity?: number;
}

export interface CategorySummary {
  category: InventoryCategory;
  totalItems: number;
  totalQuantity: number;
}

export interface CreateItemInput {
  name: string;
  sku: string;
  category: InventoryCategory;
  unit: string;
  minThreshold: number;
  supplier?: string;
  location?: string;
}

export interface UpdateItemInput extends Partial<CreateItemInput> {}

export interface RestockInput {
  itemId: string;
  quantity: number;
  note?: string;
}

export interface IssueInput {
  itemId: string;
  quantity: number;
  referenceId?: string;
  note?: string;
}

export type ReferenceType =
  | "RECEIPT"
  | "REQUISITION"
  | "PRODUCTION_ORDER"
  | "MAINTENANCE_TASK"
  | "OTHER";

// include optional referenceType to allow callers to indicate what the referenceId points to
export interface IssueInputWithRef extends IssueInput {
  referenceType?: ReferenceType;
}

export interface AdjustInput {
  itemId: string;
  quantity: number;
  note: string;
}

export interface ItemListResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TransactionListResponse {
  data: TransactionWithDetails[];
  total: number;
  totalPages: number;
}

export const inventoryApi = {
  async getItems(p?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<ItemListResponse>("/inventory/items", {
      params: p,
    });
    return response.data;
  },

  async getItem(id: string) {
    const response = await api.get<
      InventoryItem & { _count?: { transactions: number } }
    >(`/inventory/items/${id}`);
    return response.data;
  },

  async createItem(d: CreateItemInput) {
    const response = await api.post<InventoryItem>("/inventory/items", d);
    return response.data;
  },

  async updateItem(id: string, d: UpdateItemInput) {
    const response = await api.patch<InventoryItem>(
      `/inventory/items/${id}`,
      d,
    );
    return response.data;
  },

  async restock(d: RestockInput) {
    const response = await api.post<{
      item: InventoryItem;
      transaction: InventoryTransaction;
    }>("/inventory/restock", d);
    return response.data;
  },

  async issue(d: IssueInputWithRef) {
    const response = await api.post<{
      item: InventoryItem;
      transaction: InventoryTransaction;
      alert: "LOW_STOCK" | null;
    }>("/inventory/issue", d);
    return response.data;
  },

  async getValuation() {
    const response = await api.get<
      Array<{
        id: string;
        name: string;
        sku: string;
        category: InventoryCategory;
        quantity: number;
        avgUnitPrice: number;
        totalValue: number;
      }>
    >("/inventory/valuation");
    return response.data;
  },

  async getAging() {
    const response = await api.get<
      Array<{
        id: string;
        name: string;
        sku: string;
        quantity: number;
        weightedAverageAgeDays: number;
      }>
    >("/inventory/aging");
    return response.data;
  },

  async getConsumption(days = 30) {
    const response = await api.get<
      Array<{
        itemId: string;
        name: string;
        sku: string;
        issued: number;
        dailyRate: number;
      }>
    >("/inventory/consumption", { params: { days } });
    return response.data;
  },

  async adjust(d: AdjustInput) {
    const response = await api.post<{
      item: InventoryItem;
      transaction: InventoryTransaction;
      previousQuantity: number;
    }>("/inventory/adjust", d);
    return response.data;
  },

  async return(d: {
    itemId: string;
    quantity: number;
    referenceTransactionId: string;
    note?: string;
  }) {
    const response = await api.post<{
      item: InventoryItem;
      transaction: InventoryTransaction;
    }>("/inventory/return", d);
    return response.data;
  },

  async getTransactions(p?: {
    itemId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const response = await api.get<TransactionListResponse>(
      "/inventory/transactions",
      { params: p },
    );
    return response.data;
  },

  async getAlerts(params?: { category?: InventoryCategory }) {
    const response = await api.get<{
      count: number;
      category: InventoryCategory | null;
      alerts: AlertItem[];
    }>("/inventory/alerts", { params });
    return response.data;
  },

  async getSummary() {
    const response = await api.get<CategorySummary[]>("/inventory/summary");
    return response.data;
  },
};
