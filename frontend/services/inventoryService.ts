/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/api";

export const inventoryService = {
  getItems: (params?: any) => api.get("/inventory/items", { params }),
  createReceipt: (payload: any) => api.post("/inventory/receipts", payload),
  getReceipts: (params?: any) => api.get("/inventory/receipts", { params }),
  getTransactions: (params?: any) =>
    api.get("/inventory/transactions", { params }),
};

export default inventoryService;
