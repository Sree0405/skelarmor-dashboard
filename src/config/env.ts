/** Directus / API origin — no trailing slash */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://backend-skelarmor.onrender.com").replace(
  /\/$/,
  ""
);
