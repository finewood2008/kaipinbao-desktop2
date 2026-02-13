import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type ActivationStatus = "checking" | "inactive" | "active";

interface ActivationProfile {
  sub: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  iss?: string;
}

interface ActivationContextType {
  status: ActivationStatus;
  profile: ActivationProfile | null;
  activate: (idToken: string) => Promise<boolean>;
  deactivate: () => void;
}

interface ActivationStoragePayload {
  idToken: string;
  profile: ActivationProfile;
  activatedAt: string;
}

const STORAGE_KEY = "kaipinbao.activation";

const ActivationContext = createContext<ActivationContextType | undefined>(undefined);

async function verifyToken(idToken: string): Promise<ActivationProfile> {
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    let errorMessage = "激活失败，请检查 Token 是否正确";
    try {
      const errorBody = await response.json();
      errorMessage = errorBody?.error_description || errorBody?.error || errorMessage;
    } catch {
      // Ignore JSON parsing errors.
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as ActivationProfile;
}

function readStoredActivation(): ActivationStoragePayload | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActivationStoragePayload;
  } catch {
    return null;
  }
}

function writeStoredActivation(payload: ActivationStoragePayload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function clearStoredActivation() {
  localStorage.removeItem(STORAGE_KEY);
}

export function ActivationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ActivationStatus>("checking");
  const [profile, setProfile] = useState<ActivationProfile | null>(null);

  const hydrate = useCallback(async () => {
    const stored = readStoredActivation();
    if (!stored?.idToken) {
      setStatus("inactive");
      setProfile(null);
      return;
    }

    setStatus("checking");
    try {
      const verified = await verifyToken(stored.idToken);
      setProfile(verified);
      setStatus("active");
      writeStoredActivation({
        idToken: stored.idToken,
        profile: verified,
        activatedAt: stored.activatedAt || new Date().toISOString(),
      });
    } catch (error) {
      clearStoredActivation();
      setProfile(null);
      setStatus("inactive");
      if (error instanceof Error) {
        toast.error("激活已失效", { description: error.message });
      }
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const activate = useCallback(async (idToken: string) => {
    if (!idToken) {
      toast.error("请输入有效的 Token");
      return false;
    }

    setStatus("checking");
    try {
      const verified = await verifyToken(idToken);
      const payload: ActivationStoragePayload = {
        idToken,
        profile: verified,
        activatedAt: new Date().toISOString(),
      };
      writeStoredActivation(payload);
      setProfile(verified);
      setStatus("active");
      toast.success("激活成功");
      return true;
    } catch (error) {
      setStatus("inactive");
      setProfile(null);
      if (error instanceof Error) {
        toast.error("激活失败", { description: error.message });
      } else {
        toast.error("激活失败，请重试");
      }
      return false;
    }
  }, []);

  const deactivate = useCallback(() => {
    clearStoredActivation();
    setProfile(null);
    setStatus("inactive");
    toast.message("已取消激活");
  }, []);

  const value = useMemo(
    () => ({
      status,
      profile,
      activate,
      deactivate,
    }),
    [activate, deactivate, profile, status]
  );

  return <ActivationContext.Provider value={value}>{children}</ActivationContext.Provider>;
}

export function useActivation() {
  const context = useContext(ActivationContext);
  if (!context) {
    throw new Error("useActivation must be used within an ActivationProvider");
  }
  return context;
}