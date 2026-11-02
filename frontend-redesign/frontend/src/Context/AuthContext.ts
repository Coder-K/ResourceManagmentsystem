import { createContext } from "react";
import type { User } from "../Types";

export interface AuthContextValue {
  user: User | null;
  /** false while a token left in sessionStorage is being checked on page load */
  ready: boolean;
  /** message for the login page, e.g. "You were signed out after being inactive." */
  notice: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
