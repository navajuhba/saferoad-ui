import { environment } from '../../environments/environment';

/**
 * Resolves a possibly server-relative media path (e.g. a violation's image_url,
 * such as "/api/v1/violations/5/image") into an absolute URL pointing at the
 * backend. Already-absolute URLs are returned unchanged.
 */
export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${environment.apiOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
}
