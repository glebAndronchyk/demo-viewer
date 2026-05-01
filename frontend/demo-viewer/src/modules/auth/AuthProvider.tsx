import { useEffect, useState } from "react";
import { AuthContext, type AuthUser } from "./AuthContext";

interface AuthMeResponse {
  isSuccess: boolean;
  data: {
    userId: string;
    steamId: string;
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/auth/me", { credentials: "include" })
      .then((res) => {
        if (res.status === 401) return null;
        return res.json() as Promise<AuthMeResponse>;
      })
      .then((data) => {
        if (data?.isSuccess) {
          setUser({ userId: data.data.userId, steamId: data.data.steamId });
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
