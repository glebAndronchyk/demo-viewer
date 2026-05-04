import { createContext, useContext } from "react";

export interface AuthUser {
  userId: string;
  steamId: string;
  hasSharingData: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue>(null as never);

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
