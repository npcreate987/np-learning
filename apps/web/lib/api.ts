import { supabase } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function authHeader(): Promise<Record<string, string>> {
  // Dev demo mode: a local token issued by POST /auth/dev-login takes priority.
  if (typeof window !== "undefined") {
    const devToken = window.localStorage.getItem("np_dev_token");
    if (devToken) return { Authorization: `Bearer ${devToken}` };
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  if (auth) {
    Object.assign(finalHeaders, await authHeader());
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message)
        ? body.message.join(", ")
        : (body.message ?? message);
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, auth = false) => request<T>(path, { method: "GET", auth }),
  post: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      auth,
    }),
  patch: <T>(path: string, body?: unknown, auth = true) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
      auth,
    }),
  del: <T>(path: string, auth = true) =>
    request<T>(path, { method: "DELETE", auth }),
};

/** Upload a file to R2 using a presigned PUT url obtained from the API. */
export async function uploadFile(file: File): Promise<string> {
  const presign = await api.post<{ uploadUrl: string; publicUrl: string }>(
    "/uploads/presign",
    { filename: file.name, contentType: file.type || "application/octet-stream" },
  );
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!put.ok) {
    throw new ApiError(put.status, "Upload failed");
  }
  return presign.publicUrl;
}
