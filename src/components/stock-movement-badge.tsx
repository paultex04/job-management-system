import { Badge } from "@/components/ui/badge";
import { cn, MOVEMENT_STYLES, type StockMovementType } from "@/lib/utils";

/** One stock-card row's badge: what kind of movement it was. */
export default function StockMovementBadge({ type }: { type: string }) {
  const style = MOVEMENT_STYLES[type as StockMovementType];

  return (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap",
        style?.className ?? "bg-muted text-muted-foreground"
      )}
    >
      {style?.label ?? type}
    </Badge>
  );
}