export const CARTO_TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

/** Tile URL for Leaflet [TileLayer]. Uses same-origin proxy when served via Docker gateway. */
export function resolveMapTileUrl(): string {
  const override = import.meta.env.VITE_MAP_TILE_URL as string | undefined;
  if (override) {
    return override;
  }

  return resolveProxyTileUrl() ?? CARTO_TILE_URL;
}

export function resolveProxyTileUrl(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!shouldUseSameOriginProxy()) {
    return null;
  }

  return `${window.location.origin}/map-tiles/{z}/{x}/{y}.png`;
}

export function isProxyTileUrl(url: string): boolean {
  return url.includes("/map-tiles/");
}

function shouldUseSameOriginProxy(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }

  const { port } = window.location;

  if (port === "65272") {
    return true;
  }

  if (port === "" || port === "80" || port === "443") {
    return true;
  }

  return false;
}
