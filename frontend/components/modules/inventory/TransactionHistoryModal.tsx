"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi, type TransactionWithDetails } from "@/lib/api/inventory";
import { Dialog, Button } from "./ui";

export function TransactionHistoryModal({
  isOpen,
  onClose,
  itemId,
}: {
  isOpen: boolean;
  onClose: () => void;
  itemId?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory-item-transactions", itemId],
    queryFn: () =>
      inventoryApi.getTransactions({ itemId, page: 1, limit: 100 }),
    enabled: Boolean(isOpen && itemId),
  });

  useEffect(() => {
    // no-op
  }, [data]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction History"
      description="Recent transactions and lifecycle for this item"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-slate-500">
            Loading...
          </div>
        ) : data && data.data.length > 0 ? (
          <div className="space-y-3">
            {data.data.map((t: TransactionWithDetails) => (
              <div key={t.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{t.type}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleString()}
                    </div>
                    {t.referenceId ? (
                      <div className="mt-1 text-xs text-slate-500">
                        Ref: {t.referenceId}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{t.quantity}</div>
                    <div className="text-xs text-slate-500">
                      by {t.performedBy.username}
                    </div>
                    {t.type === "ISSUE" && (t as any).returnedQuantity ? (
                      <div className="text-xs text-amber-700">
                        Returned: {(t as any).returnedQuantity}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-sm text-slate-500">
            No transactions
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <Button onClick={onClose} variant="secondary">
          Close
        </Button>
      </div>
    </Dialog>
  );
}
