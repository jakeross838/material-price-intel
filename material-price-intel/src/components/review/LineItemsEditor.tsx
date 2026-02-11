import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LineItemType } from "@/lib/types";

export type EditableLineItem = {
  id: string; // temp ID for React key
  raw_description: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  line_total: number | null;
  notes: string | null;
  confidence?: number;
  line_type: LineItemType;
  effective_unit_price: number | null;
  discount_pct?: number | null;
  discount_amount?: number | null;
};

type LineItemsEditorProps = {
  items: EditableLineItem[];
  onChange: (items: EditableLineItem[]) => void;
};

function updateItem(
  items: EditableLineItem[],
  index: number,
  field: keyof EditableLineItem,
  value: string | number | null
): EditableLineItem[] {
  return items.map((item, i) =>
    i === index ? { ...item, [field]: value } : item
  );
}

function parseNumber(raw: string): number | null {
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
  function handleFieldChange(
    index: number,
    field: keyof EditableLineItem,
    raw: string
  ) {
    const numericFields: (keyof EditableLineItem)[] = [
      "quantity",
      "unit_price",
      "line_total",
    ];
    const value = numericFields.includes(field) ? parseNumber(raw) : raw;
    let updated = updateItem(items, index, field, value);

    // When line_type changes, recompute effective_unit_price
    if (field === "line_type") {
      const item = updated[index];
      if (raw === "material") {
        // Reclassified TO material: compute effective_unit_price from discount fields
        let effectivePrice = item.unit_price;
        if (effectivePrice != null) {
          if (item.discount_pct != null && item.discount_pct > 0) {
            effectivePrice = effectivePrice * (1 - item.discount_pct / 100);
          } else if (
            item.discount_amount != null &&
            item.discount_amount > 0 &&
            item.quantity != null &&
            item.quantity > 0
          ) {
            effectivePrice =
              effectivePrice - item.discount_amount / item.quantity;
          }
          effectivePrice = Math.max(
            0,
            Math.round(effectivePrice * 10000) / 10000
          );
        }
        updated = updateItem(
          updated,
          index,
          "effective_unit_price",
          effectivePrice
        );
      } else {
        // Reclassified AWAY from material: null out effective_unit_price
        updated = updateItem(updated, index, "effective_unit_price", null);
      }
    }

    onChange(updated);
  }

  function handleAddRow() {
    const newItem: EditableLineItem = {
      id: crypto.randomUUID(),
      raw_description: "",
      quantity: null,
      unit: null,
      unit_price: null,
      line_total: null,
      notes: null,
      line_type: "material",
      effective_unit_price: null,
    };
    onChange([...items, newItem]);
  }

  function handleDeleteRow(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-2 py-2 text-left font-medium w-10">#</th>
              <th className="px-2 py-2 text-left font-medium w-28">Type</th>
              <th className="px-2 py-2 text-left font-medium min-w-[200px]">
                Description
              </th>
              <th className="px-2 py-2 text-right font-medium w-20">Qty</th>
              <th className="px-2 py-2 text-left font-medium w-20">Unit</th>
              <th className="px-2 py-2 text-right font-medium w-28">
                Unit Price
              </th>
              <th className="px-2 py-2 text-right font-medium w-28">
                Line Total
              </th>
              <th className="px-2 py-2 text-center font-medium w-12">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const lowConfidence =
                item.confidence != null && item.confidence < 0.7;
              return (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b last:border-0",
                    lowConfidence && "bg-amber-50",
                    item.line_type === "discount" &&
                      !lowConfidence &&
                      "bg-orange-50/50",
                    item.line_type === "fee" &&
                      !lowConfidence &&
                      "bg-purple-50/50",
                    item.line_type === "subtotal_line" &&
                      !lowConfidence &&
                      "bg-gray-50/50",
                    item.line_type === "note" &&
                      !lowConfidence &&
                      "bg-gray-50/50 opacity-60"
                  )}
                >
                  <td className="px-2 py-1.5 text-muted-foreground tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={item.line_type}
                      onChange={(e) =>
                        handleFieldChange(i, "line_type", e.target.value)
                      }
                      className={cn(
                        "h-8 w-full rounded-md border border-input bg-transparent px-1.5 text-xs",
                        item.line_type === "discount" &&
                          "text-orange-600 bg-orange-50",
                        item.line_type === "fee" &&
                          "text-purple-600 bg-purple-50",
                        item.line_type === "subtotal_line" &&
                          "text-gray-500 bg-gray-50",
                        item.line_type === "note" &&
                          "text-gray-400 bg-gray-50 italic"
                      )}
                    >
                      <option value="material">Material</option>
                      <option value="discount">Discount</option>
                      <option value="fee">Fee</option>
                      <option value="subtotal_line">Subtotal</option>
                      <option value="note">Note</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={item.raw_description}
                      onChange={(e) =>
                        handleFieldChange(i, "raw_description", e.target.value)
                      }
                      className="h-8 text-sm"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      value={item.quantity ?? ""}
                      onChange={(e) =>
                        handleFieldChange(i, "quantity", e.target.value)
                      }
                      className="h-8 text-right tabular-nums text-sm"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={item.unit ?? ""}
                      onChange={(e) =>
                        handleFieldChange(i, "unit", e.target.value)
                      }
                      className="h-8 text-sm"
                      placeholder="ea"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unit_price ?? ""}
                      onChange={(e) =>
                        handleFieldChange(i, "unit_price", e.target.value)
                      }
                      className="h-8 text-right tabular-nums text-sm"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.line_total ?? ""}
                      onChange={(e) =>
                        handleFieldChange(i, "line_total", e.target.value)
                      }
                      className="h-8 text-right tabular-nums text-sm"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDeleteRow(i)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Remove line item</span>
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddRow}
        className="gap-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Line Item
      </Button>
    </div>
  );
}
