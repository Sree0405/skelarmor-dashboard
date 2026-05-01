import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "./useDebouncedValue";
import type { FilterOption } from "./types";

export type AsyncFilterDropdownProps = {
  label: string;
  mode: "single" | "multi";
  selected: string[];
  onChange: (next: string[]) => void;
  /** Options always shown / searched locally first. */
  staticOptions?: FilterOption[];
  /** Optional async loader for large option sets (debounced internally). */
  loadOptions?: (query: string) => Promise<FilterOption[]>;
  disabled?: boolean;
};

function mergeOptions(staticOpts: FilterOption[], asyncOpts: FilterOption[]): FilterOption[] {
  const seen = new Set<string>();
  const out: FilterOption[] = [];
  for (const o of [...staticOpts, ...asyncOpts]) {
    if (seen.has(o.value)) continue;
    seen.add(o.value);
    out.push(o);
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

function summarize(selected: string[], options: FilterOption[], label: string): string {
  if (selected.length === 0) return label;
  if (selected.length === 1) {
    const o = options.find((x) => x.value === selected[0]);
    return o?.label ?? selected[0]!;
  }
  return `${selected.length} selected`;
}

/**
 * Single reusable filter control: consistent popover + command UI, local + async options,
 * single or multi-select, clear/reset.
 */
export function AsyncFilterDropdown({
  label,
  mode,
  selected,
  onChange,
  staticOptions = [],
  loadOptions,
  disabled,
}: AsyncFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);
  const [asyncOpts, setAsyncOpts] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !loadOptions) {
      setAsyncOpts([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void loadOptions(debouncedQuery)
      .then((rows) => {
        if (!cancelled) setAsyncOpts(rows);
      })
      .catch(() => {
        if (!cancelled) setAsyncOpts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, loadOptions, debouncedQuery]);

  const merged = useMemo(
    () => mergeOptions(staticOptions, asyncOpts),
    [staticOptions, asyncOpts]
  );

  const filteredLocal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return merged;
    return merged.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
  }, [merged, query]);

  const displayOptions = loadOptions ? merged : filteredLocal;

  const toggle = useCallback(
    (value: string) => {
      if (mode === "single") {
        onChange(selected.includes(value) ? [] : [value]);
        setOpen(false);
        return;
      }
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value));
      } else {
        onChange([...selected, value]);
      }
    },
    [mode, onChange, selected]
  );

  const clear = useCallback(() => {
    onChange([]);
    setQuery("");
  }, [onChange]);

  const triggerLabel = summarize(selected, displayOptions, label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 min-w-[7.5rem] max-w-[11rem] justify-between rounded-lg border-border bg-background/80 px-2.5 text-left text-xs font-normal shadow-sm",
            selected.length > 0 && "border-primary/40 bg-primary/5"
          )}
        >
          <span className="truncate text-sm">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && loadOptions ? (
              <div className="space-y-2 p-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <>
                <CommandEmpty>No matches.</CommandEmpty>
                <CommandGroup className="max-h-[min(55vh,260px)] overflow-y-auto p-1">
                  {displayOptions.map((opt) => {
                    const checked = selected.includes(opt.value);
                    return (
                      <CommandItem
                        key={opt.value}
                        value={opt.value}
                        onSelect={() => toggle(opt.value)}
                        className="cursor-pointer"
                      >
                        {mode === "multi" ? (
                          <Checkbox
                            checked={checked}
                            className="mr-2 pointer-events-none"
                            aria-hidden
                          />
                        ) : (
                          <Check
                            className={cn("mr-2 h-4 w-4", checked ? "opacity-100" : "opacity-0")}
                          />
                        )}
                        <span className="truncate">{opt.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
        <div className="flex items-center justify-between border-t border-border px-2 py-2">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={clear}>
            <X className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
          {loading && loadOptions && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading
            </span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
