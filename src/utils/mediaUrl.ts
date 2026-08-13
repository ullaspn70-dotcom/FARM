const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Resolve uploaded file URLs from API (handles relative paths and legacy localhost URLs). */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url || url === "#") return "";

  if (url.startsWith("http://localhost") || url.startsWith("https://localhost")) {
    try {
      const path = new URL(url).pathname;
      return `${API_BASE.replace(/\/$/, "")}${path}`;
    } catch {
      return url;
    }
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

export function isImageFile(nameOrUrl: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(nameOrUrl);
}
