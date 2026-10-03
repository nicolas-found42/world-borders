/** Resolve public assets under both a Pages project prefix and a root-hosted build. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
