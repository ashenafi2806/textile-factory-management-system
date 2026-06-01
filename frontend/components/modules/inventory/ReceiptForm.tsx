"use client";
import React, { useEffect, useState } from "react";
import inventoryService from "@/services/inventoryService";
import workforceService from "@/services/workforceService";

type Row = { itemId: string; quantity: number; unitPrice?: number };

export default function ReceiptForm() {
  const [items, setItems] = useState<any[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { itemId: "", quantity: 0, unitPrice: 0 },
  ]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await inventoryService.getItems();
        setItems(res.data.data || res.data);
      } catch (e) {
        try {
          console.error("Failed to load items", e);
        } catch (er) {}
      }
    })();
  }, []);

  const addRow = () =>
    setRows((r) => [...r, { itemId: "", quantity: 0, unitPrice: 0 }]);
  const removeRow = (idx: number) =>
    setRows((r) => r.filter((_, i) => i !== idx));

  const updateRow = (idx: number, patch: Partial<Row>) =>
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // client-side validation
    const validationErrors: any = {};
    if (!supplierName || supplierName.trim() === "")
      validationErrors.supplierName = "Supplier name is required";
    if (!purchaseDate)
      validationErrors.purchaseDate = "Purchase date is required";
    const rowErrors = rows.map((r) => {
      const re: any = {};
      if (!r.itemId) re.itemId = "Item is required";
      if (typeof r.quantity !== "number" || Number(r.quantity) <= 0)
        re.quantity = "Quantity must be greater than 0";
      return re;
    });
    if (rowErrors.some((r) => Object.keys(r).length > 0))
      validationErrors.rows = rowErrors;

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        supplierName,
        batchNumber,
        purchaseDate,
        items: rows.map((r) => ({
          itemId: r.itemId,
          quantity: Number(r.quantity),
          unitPrice: r.unitPrice,
        })),
      };

      await inventoryService.createReceipt(payload);
      alert("Receipt saved");
      // reset
      setSupplierName("");
      setBatchNumber("");
      setPurchaseDate("");
      setRows([{ itemId: "", quantity: 0, unitPrice: 0 }]);
      setErrors({});
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || "Failed to create receipt";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
          {errors.supplierName && (
            <p className="text-red-600 text-sm mt-1">{errors.supplierName}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium">Batch / Lot</label>
          <input
            value={batchNumber}
            onChange={(e) => setBatchNumber(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Purchase Date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="mt-1 block w-full border rounded p-2"
          />
          {errors.purchaseDate && (
            <p className="text-red-600 text-sm mt-1">{errors.purchaseDate}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Items</label>
        <div className="space-y-2 mt-2">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-2 items-end">
              <div className="col-span-2">
                <select
                  value={row.itemId}
                  onChange={(e) => updateRow(idx, { itemId: e.target.value })}
                  className="w-full border rounded p-2"
                >
                  <option value="">Select item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {`${it.name} (${it.sku})`}
                    </option>
                  ))}
                </select>
                {errors.rows && errors.rows[idx] && errors.rows[idx].itemId && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.rows[idx].itemId}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(idx, { quantity: Number(e.target.value) })
                  }
                  className="w-full border rounded p-2"
                  placeholder="Quantity"
                />
                {errors.rows &&
                  errors.rows[idx] &&
                  errors.rows[idx].quantity && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.rows[idx].quantity}
                    </p>
                  )}
              </div>
              <div>
                <input
                  type="number"
                  step="any"
                  value={row.unitPrice}
                  onChange={(e) =>
                    updateRow(idx, { unitPrice: Number(e.target.value) })
                  }
                  className="w-full border rounded p-2"
                  placeholder="Unit price"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div>
            <button
              type="button"
              onClick={addRow}
              className="mt-2 inline-flex items-center px-3 py-1 border rounded"
            >
              Add item
            </button>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          {saving ? "Saving..." : "Save Receipt"}
        </button>
      </div>
    </form>
  );
}
