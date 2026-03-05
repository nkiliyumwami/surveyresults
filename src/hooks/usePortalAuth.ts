import { useState, useEffect, useCallback } from "react";
import {
  portalLogin,
  portalGetMe,
  portalLogout,
  getPortalToken,
  type PortalStudent,
  type PortalCreds,
} from "@/lib/portalApi";

export function usePortalAuth() {
  const [student, setStudent] = useState<PortalStudent | null>(null);
  const [creds, setCreds] = useState<PortalCreds | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const token = getPortalToken();
    if (!token) {
      setLoading(false);
      return;
    }

    portalGetMe()
      .then(({ student, creds }) => {
        setStudent(student);
        setCreds(creds);
      })
      .catch(() => {
        portalLogout();
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const { student, creds } = await portalLogin(username, password);
      setStudent(student);
      setCreds(creds);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    portalLogout();
    setStudent(null);
    setCreds(null);
  }, []);

  return { student, creds, loading, error, login, logout };
}
