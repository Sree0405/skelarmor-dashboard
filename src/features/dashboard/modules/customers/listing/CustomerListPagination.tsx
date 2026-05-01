import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CUSTOMER_LIST_PAGE_SIZES } from "./useCustomerListingUrlState";

type PageSize = (typeof CUSTOMER_LIST_PAGE_SIZES)[number];

type Props = {
  page: number;
  pageSize: PageSize;
  pageSizes: readonly PageSize[];
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  disabled?: boolean;
};

function windowRange(page: number, totalPages: number, width = 5): number[] {
  if (totalPages <= width) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const half = Math.floor(width / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + width - 1);
  if (end - start + 1 < width) start = Math.max(1, end - width + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function CustomerListPagination({
  page,
  pageSize,
  pageSizes,
  total,
  onPageChange,
  onPageSizeChange,
  disabled,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  const pages = windowRange(current, totalPages);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p className="text-xs text-muted-foreground tabular-nums">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v) as PageSize)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[76px] rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizes.map((ps) => (
                <SelectItem key={ps} value={String(ps)}>
                  {ps}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent className="flex-wrap gap-1">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={cn(
                  current <= 1 && "pointer-events-none opacity-40",
                  "h-8 rounded-lg text-xs sm:px-2"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (current > 1) onPageChange(current - 1);
                }}
              />
            </PaginationItem>
            {pages[0]! > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    href="#"
                    className="h-8 w-8 rounded-lg text-xs"
                    onClick={(e) => {
                      e.preventDefault();
                      onPageChange(1);
                    }}
                  >
                    1
                  </PaginationLink>
                </PaginationItem>
                {pages[0]! > 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
              </>
            )}
            {pages.map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === current}
                  className="h-8 min-w-8 rounded-lg text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            {pages[pages.length - 1]! < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            {pages[pages.length - 1]! < totalPages && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  className="h-8 w-8 rounded-lg text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(totalPages);
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                className={cn(
                  current >= totalPages && "pointer-events-none opacity-40",
                  "h-8 rounded-lg text-xs sm:px-2"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  if (current < totalPages) onPageChange(current + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
