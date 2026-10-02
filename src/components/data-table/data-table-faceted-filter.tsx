"use client";

import * as React from "react";
import { FunnelIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DataTableFacetOption = { label: string; value: string };

type Props = {
  title: string;
  options: DataTableFacetOption[];
  /** Currently selected values (multi-select). */
  value: string[];
  onChange: (next: string[]) => void;
};

/**
 * Faceted filter — the shadcn data-table filter: a popover of checkboxes so a
 * column can be narrowed to any combination of values at once.
 */
export default function DataTableFacetedFilter({
  title,
  options,
  value,
  onChange,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(() => new Set(value), [value]);
  const filtered = value.length > 0;

  const toggle = (option: string) => {
    onChange(
      selected.has(option) ? value.filter((item) => item !== option) : [...value, option]
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={filtered ? undefined : "border-dashed"}
        >
          <FunnelIcon data-icon="inline-start" />
          {title}
          {filtered && (
            <Badge variant="secondary" className="tabular-nums">
              {value.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  keywords={[option.label]}
                  data-checked={selected.has(option.value)}
                  onSelect={() => toggle(option.value)}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {filtered && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    onSelect={() => onChange([])}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}