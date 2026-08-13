const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Resolve uploaded file URLs from API (handles relative paths, legacy localhost, and data URLs). */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return "";
  const cleaned = url.trim();
  if (!cleaned || cleaned === "#") return "";

  if (cleaned.startsWith("data:")) return cleaned;

  if (cleaned.startsWith("http://localhost") || cleaned.startsWith("https://localhost")) {
    try {
      const path = new URL(cleaned).pathname;
      return `${API_BASE.replace(/\/$/, "")}${path}`;
    } catch {
      return cleaned;
    }
  }

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  const path = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

export function isImageFile(nameOrUrl: string): boolean {
  return /\.(jpe?g|png|gif|webp|bmp)$/i.test(nameOrUrl.split("?")[0]);
}

export function isPdfFile(nameOrUrl: string): boolean {
  return /\.pdf$/i.test(nameOrUrl.split("?")[0]);
}
