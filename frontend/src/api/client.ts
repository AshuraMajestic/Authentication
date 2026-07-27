import type { ApiResult } from "../types/auth";
import { tokenStore } from "./tokenStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

async function raw(path: string, options: RequestInit = {}) {
  const token = tokenStore.get();
  return fetch(`${BASE_URL}${path}`, {
    credentials: "include", // sends the httpOnly refresh cookie
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}

async function parse<T>(res: Response): Promise<ApiResult<T>> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    return { ok: false, error: body?.error ?? body?.message ?? `Request failed (${res.status})` };
  }
  return { ok: true, data: (body?.data ?? body) as T };
}

async function request<T>(path: string, options: RequestInit = {}, retried = false): Promise<ApiResult<T>> {
  try {
    const res = await raw(path, options);

    // Access token expired — try one silent refresh, then retry the original call.
    if (res.status === 401 && !retried && path !== "/auth/refresh") {
      const refreshRes = await raw("/auth/refresh", { method: "POST" });
      if (refreshRes.ok) {
        const body = await refreshRes.json();
        tokenStore.set(body.accessToken ?? null);
        return request<T>(path, options, true);
      }
      tokenStore.set(null);
    }

    return parse<T>(res);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error." };
  }
}

export const api = {
  get: <T,>(path: string, options?: RequestInit) => request<T>(path, { ...options, method: "GET" }),
  post: <T,>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T,>(path: string, body?: unknown, options?: RequestInit) =>
    request<T>(path, { ...options, method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
};