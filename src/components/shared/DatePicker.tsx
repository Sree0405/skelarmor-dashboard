import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type DatePickerProps = {
  /** ISO date string `yyyy-MM-dd` */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Shown when `value` is empty */
  placeholder?: string;
  id?: string;
};

function parseIsoDate(s: string): Date | undefined {
  if (!s?.trim()) return undefined;
  const d = parse(s.trim(), "yyyy-MM-dd", new Date());
  return isValid(d) ? d : undefined;
}

/**
 * Single-date picker built on `react-day-picker` (via shadcn `Calendar`) + Radix Popover.
 */
export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder = "Pick a date",
  id,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal rounded-lg border-border bg-secondary/50",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-60" aria-hidden />
          {selected ? format(selected, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
