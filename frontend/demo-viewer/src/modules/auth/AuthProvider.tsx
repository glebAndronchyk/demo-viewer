import { useEffect, useState } from "react";
import { AuthContext, type AuthUser } from "./AuthContext";
import { AppConfiguration } from "../../features/configuration";

interface AuthMeResponse {
  isSuccess: boolean;
  data: {
    userId: string;
    steamId: string;
    hasSharingData: boolean;
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${AppConfiguration.apiUrl}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) return null;
        return res.json() as Promise<AuthMeResponse>;
      })
      .then((data) => {
        if (data?.isSuccess) {
          const authUser: AuthUser = {
            userId: data.data.userId,
            steamId: data.data.steamId,
            hasSharingData: data.data.hasSharingData,
          };
          setUser(authUser);
          if (!data.data.hasSharingData) {
            const redirect = `${window.location.origin}/account/sharing-settings`;
            if (window.location.href.includes(redirect)) return;
            window.location.href = redirect;
          }
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
