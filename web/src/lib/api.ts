export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

/**
 * Central fetch utility that automatically prepends the correct API URL
 * depending on the environment (local vs production).
 */
export async function apiFetch(endpoint: string, options?: RequestInit) {
  // Ensure endpoint starts with a slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  return response;
}
