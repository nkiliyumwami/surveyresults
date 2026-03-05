const API_URL = import.meta.env.VITE_ICCA_API_URL;
const TOKEN_KEY = "icca_token";

// Types
export interface PortalStudent {
  username: string;
  name: string;
  role: "student" | "admin";
  status: "running" | "stopped" | "expired" | "revoked";
  expiresAt: string;
  telegramLinked: boolean;
  telegramUsername: string | null;
}

export interface PortalCreds {
  host: string;
  sshPort: number;
  sshUser: string;
  sshPass: string;
}

export interface AdminStudent {
  username: string;
  name: string;
  host: string | null;
  sshPort: number | null;
  containerId: string | null;
  status: string;
  expiresAt: string;
  telegramLinked: boolean;
  revoked: boolean;
  createdAt: string;
}

// Token helpers
export function getPortalToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setPortalToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearPortalToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// Base fetch helper
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getPortalToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data as T;
}

// Auth functions
export async function portalLogin(
  username: string,
  password: string
): Promise<{ token: string; student: PortalStudent; creds: PortalCreds }> {
  const data = await apiFetch<{
    token: string;
    student: PortalStudent;
    creds: PortalCreds;
  }>("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  setPortalToken(data.token);
  return data;
}

export async function portalGetMe(): Promise<{
  student: PortalStudent;
  creds: PortalCreds;
}> {
  return apiFetch<{ student: PortalStudent; creds: PortalCreds }>("/me");
}

export function portalLogout(): void {
  clearPortalToken();
}

// Admin functions
export async function adminListStudents(): Promise<{
  students: AdminStudent[];
}> {
  return apiFetch<{ students: AdminStudent[] }>("/admin/students");
}

export async function adminCreateStudent(data: {
  username: string;
  name: string;
  password: string;
  days: number;
  telegramUsername?: string;
}): Promise<{ ok: boolean; host: string; sshPort: number }> {
  return apiFetch<{ ok: boolean; host: string; sshPort: number }>(
    "/admin/students",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function adminExtendStudent(
  username: string,
  days: number
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/admin/extend", {
    method: "POST",
    body: JSON.stringify({ username, days }),
  });
}

export async function adminRevokeStudent(
  username: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/admin/revoke", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function adminNotifyStudent(
  username: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/admin/notify", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function adminRestartContainer(
  username: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/admin/container/restart", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

export async function adminStopContainer(
  username: string
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>("/admin/container/stop", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}
