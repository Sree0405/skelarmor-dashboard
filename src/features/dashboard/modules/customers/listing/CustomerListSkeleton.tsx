import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLS = ["Name", "Age", "Goal", "Weight", "Fat %", "Status", "Billing"];

export function CustomerListTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          {COLS.map((h) => (
            <TableHead key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i} className="border-border/50">
            {COLS.map((c) => (
              <TableCell key={c} className="px-6 py-4">
                <Skeleton className={c === "Name" ? "h-4 w-40" : "h-4 w-16"} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CustomerFilterBarSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/50 bg-muted/15 p-3">
      <Skeleton className="h-9 flex-1 min-w-[180px] max-w-md rounded-lg" />
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-[7.5rem] rounded-lg" />
      ))}
    </div>
  );
}
