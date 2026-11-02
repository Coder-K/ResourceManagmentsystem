import { get, post } from "./ApiClient";
import type { LoginResponse, User } from "../Types";

// login and getting the token
export const login = (email: string, password: string) =>
  post<LoginResponse>("/auth/login", { email, password });

// revokes the token on the server
export const logout = () => post<void>("/auth/logout");

// current user (also used as a keep-alive ping)
export const getMe = () => get<User>("/auth/me");
