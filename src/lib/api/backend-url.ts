import { config } from '@/config';

function normalizeBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  return withScheme.replace(/\/+$/, '');
}

function stripApiSuffix(baseUrl: string): string {
  return baseUrl.replace(/\/api\/?$/i, '');
}

export function getBackendBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || config.api.baseUrl;
  const normalized = normalizeBaseUrl(raw);
  return stripApiSuffix(normalized);
}

export function buildBackendUrl(endpoint: string): string {
  const base = getBackendBaseUrl();
  const [pathPart, queryPart] = endpoint.split('?');
  const normalizedPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return `${base}${normalizedPath}${queryPart ? `?${queryPart}` : ''}`;
}
