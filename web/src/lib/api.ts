function resolveApiUrl(rawUrl: string): string {
  const trimmed = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
  if (typeof window === "undefined") return trimmed;

  try {
    const parsed = new URL(trimmed);
    const pageHost = window.location.hostname;
    const isPageLoopback = pageHost === "localhost" || pageHost === "127.0.0.1";
    const isApiLoopback =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

    // Browsers treat "localhost" and "127.0.0.1" as different sites (cross-site),
    // which blocks SameSite=Lax HttpOnly cookies on fetch() calls. Align loopback
    // hostnames so local dev cookies are always same-site.
    if (isPageLoopback && isApiLoopback && parsed.hostname !== pageHost) {
      parsed.hostname = pageHost;
      return parsed.origin + parsed.pathname.replace(/\/$/, "");
    }
  } catch {
    // Fallback to raw URL if not a valid absolute URL (e.g., relative proxy path)
  }

  return trimmed;
}

export const API_URL = resolveApiUrl(
  import.meta.env.VITE_API_URL || "http://localhost:3000"
);

export const UNAUTHORIZED_EVENT = "vanguard:unauthorized";

/**
 * Central fetch utility that automatically prepends the correct API URL,
 * sends HttpOnly session cookies (`credentials: "include"`), and dispatches
 * an unauthorized event on HTTP 401 so AuthContext can log out automatically.
 */
export async function apiFetch(endpoint: string, options?: RequestInit) {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const headers = new Headers(options?.headers);
  if (options?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (
    response.status === 401 &&
    !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/me")
  ) {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }

  return response;
}
