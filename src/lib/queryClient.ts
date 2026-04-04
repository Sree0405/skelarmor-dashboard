import { QueryClient } from "@tanstack/react-query";

const STALE_MS = 7 * 60 * 1000;
const GC_MS = 30 * 60 * 1000;

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_MS,
        gcTime: GC_MS,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}
