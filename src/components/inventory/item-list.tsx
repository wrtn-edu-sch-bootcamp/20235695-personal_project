"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ItemStatusBadge } from "./item-status-badge";
import { InventoryItem } from "@/types/database";

interface ItemListProps {
  items: InventoryItem[];
}

export function ItemList({ items }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        해당하는 품목이 없습니다
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>상품명</TableHead>
            <TableHead className="w-[70px] text-right">재고서</TableHead>
            <TableHead className="w-[70px] text-right">실물</TableHead>
            <TableHead className="w-[80px] text-center">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className={
                item.status === "mismatched" ? "bg-destructive/5" : ""
              }
            >
              <TableCell>
                <div>
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {item.barcode}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.expected_quantity}
              </TableCell>
              <TableCell className="text-right font-medium">
                {item.actual_quantity ?? "-"}
              </TableCell>
              <TableCell className="text-center">
                <ItemStatusBadge status={item.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
