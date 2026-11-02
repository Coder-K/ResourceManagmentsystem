// The ONLY file that calls fetch(). Every service in this folder goes through request().
// It adds the JWT, turns API errors into readable messages, and signs the user out on any 401.

const BASE_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:44372/api";

const TOKEN_KEY = "rms_token";
const IDLE_KEY = "rms_idle_minutes";

// sessionStorage: cleared when the tab closes (the old code used localStorage, which survives for ever).
export const tokenStore = {
  get: (): string | null => sessionStorage.getItem(TOKEN_KEY),
  set: (token: string, idleMinutes: number) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(IDLE_KEY, String(idleMinutes));
  },
  idleMinutes: (): number => Number(sessionStorage.getItem(IDLE_KEY)) || 60,
  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(IDLE_KEY);
  },
};

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const errorMessage = (err: unknown): string =>
  err instanceof Error
    ? err.message
    : "Something went wrong. Please try again.";

interface ProblemBody {
  detail?: string;
  title?: string;
  errors?: Record<string, string[]>;
}

function messageFrom(status: number, data: ProblemBody | null): string {
  if (data?.errors) return Object.values(data.errors).flat().join(" "); // validation errors
  if (data?.detail) return data.detail; // errors the API wrote on purpose
  if (data?.title) return data.title;
  if (status === 403) return "You do not have permission to do that.";
  if (status === 429)
    return "Too many attempts. Please wait a minute and try again.";
  return "Something went wrong. Please try again.";
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      0,
      "Cannot reach the server. Check that the API is running.",
    );
  }

  // A 401 while holding a token means it expired, was revoked, or the access level changed.
  if (res.status === 401 && token) {
    onUnauthorized();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => null)) as ProblemBody | null;
  if (!res.ok) throw new ApiError(res.status, messageFrom(res.status, data));
  return data as T;
}

export const get = <T>(path: string) => request<T>("GET", path);
export const post = <T>(path: string, body: unknown = {}) =>
  request<T>("POST", path, body);
export const put = <T>(path: string, body: unknown) =>
  request<T>("PUT", path, body);
export const del = <T>(path: string) => request<T>("DELETE", path);
