export function stripBasePath(pathname: string): string {
  const base = import.meta.env.BASE_URL;
  if (base === "/") return pathname;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  if (pathname.startsWith(normalizedBase)) {
    const stripped = pathname.slice(normalizedBase.length);
    return stripped.startsWith("/") ? stripped : "/" + stripped;
  }
  return pathname;
}

export function withBasePath(path: string): string {
  const base = import.meta.env.BASE_URL;
  if (base === "/") return path;
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  return normalizedBase + path;
}
