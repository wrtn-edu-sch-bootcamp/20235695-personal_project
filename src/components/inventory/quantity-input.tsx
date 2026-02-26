"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryItem } from "@/types/database";
import { Check, X, Minus, Plus, Loader2 } from "lucide-react";

interface QuantityInputProps {
  item: InventoryItem;
  onSubmit: (itemId: string, quantity: number) => Promise<void>;
  onCancel: () => void;
}

export function QuantityInput({ item, onSubmit, onCancel }: QuantityInputProps) {
  const [quantity, setQuantity] = useState(item.expected_quantity);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(item.id, quantity);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMatch = quantity === item.expected_quantity;

  return (
    <Card className="border-2 border-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{item.product_name}</CardTitle>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {item.barcode}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md bg-muted p-3">
          <span className="text-sm text-muted-foreground">재고서 수량</span>
          <span className="text-lg font-bold">{item.expected_quantity}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">실물 수량</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => Math.max(0, q - 1))}
              disabled={quantity <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
              className="text-center text-lg font-bold"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {quantity !== item.expected_quantity && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm font-medium text-destructive">
              차이: {quantity - item.expected_quantity > 0 ? "+" : ""}
              {quantity - item.expected_quantity}개
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Badge variant={isMatch ? "default" : "destructive"}>
            {isMatch ? (
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3" /> 일치
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <X className="h-3 w-3" /> 불일치
              </span>
            )}
          </Badge>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          확인 완료
        </Button>
      </CardContent>
    </Card>
  );
}
