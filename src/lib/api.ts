/**
 * Central API surface — prefer importing `api` for authenticated Directus calls.
 * @see apiClient.ts
 */
export { api, authPublicApi } from "./apiClient";
export { API_BASE_URL } from "@/config/env";
