/**
 * Breaks circular imports between the axios client and the auth store.
 * Registered once when the auth store module finishes loading.
 */
let getTokenImpl: () => string | null = () => null;

export function registerAuthTokenGetter(fn: () => string | null): void {
  getTokenImpl = fn;
}

export function getAccessToken(): string | null {
  return getTokenImpl();
}
