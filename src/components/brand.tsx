import { PackageIcon } from "lucide-react";

/** Brand row: logo mark + name (registry sidebar `size="lg"` menu button). */
export default function Brand({
  name,
  logo,
}: {
  name: string;
  logo?: string | null;
}) {
  return (
    <>
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={32} height={32} className="size-8 shrink-0 object-cover" />
        ) : (
          <PackageIcon aria-hidden />
        )}
      </span>
      <span
        translate="no"
        className="grid min-w-0 flex-1 text-left leading-tight"
      >
        <span className="truncate text-sm font-semibold">{name}</span>
      </span>
    </>
  );
}
