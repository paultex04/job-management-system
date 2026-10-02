import { cn, STATUS_STYLES } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </Badge>
  );
}
