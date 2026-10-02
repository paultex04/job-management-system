import { cn } from "@/lib/utils";
import {
  Avatar as AvatarRoot,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export default function Avatar({
  src,
  name,
  size = "size-8",
  textSize = "text-xs",
}: {
  src?: string | null;
  name: string;
  size?: string;
  textSize?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <AvatarRoot className={size}>
      {src && <AvatarImage src={src} alt={name} />}
      <AvatarFallback
        className={cn(
          "bg-primary font-semibold uppercase text-primary-foreground",
          textSize
        )}
      >
        {initials || "?"}
      </AvatarFallback>
    </AvatarRoot>
  );
}
