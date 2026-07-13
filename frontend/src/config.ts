/**
 * Central config sourced from Vite environment variables (.env).
 * All environment variables must be prefixed with VITE_ to be exposed.
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
export const ASSETS_BASE = import.meta.env.VITE_ASSETS_BASE_URL as string;

/**
 * Resolves an asset URL: if it already starts with http, use as-is.
 * Otherwise prepend the backend assets base URL.
 */
export function resolveAssetUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${ASSETS_BASE}${url}`;
}
