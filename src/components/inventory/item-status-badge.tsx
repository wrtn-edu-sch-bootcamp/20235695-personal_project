import { Badge } from "@/components/ui/badge";
import { ItemStatus } from "@/types/database";
import { Check, X, Clock } from "lucide-react";

const statusConfig: Record<
  ItemStatus,
  { label: string; variant: "default" | "secondary" | "destructive"; icon: typeof Check }
> = {
  pending: { label: "대기", variant: "secondary", icon: Clock },
  matched: { label: "일치", variant: "default", icon: Check },
  mismatched: { label: "불일치", variant: "destructive", icon: X },
};

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}
