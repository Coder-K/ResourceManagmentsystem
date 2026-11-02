import { del, get, post, put } from "./ApiClient";
import type { NewUserInput, UpdateUserInput, User } from "../Types";

// getting all users (Manager, Admin)
export const getUsers = () => get<User[]>("/user");

// grabbing a user by id
export const getUserById = (id: number) => get<User>(`/user/${id}`);

// adding a new user
export const addUser = (user: NewUserInput) => post<User>("/user", user);

// updating details by id
export const updateUser = (id: number, user: UpdateUserInput) => put<User>(`/user/${id}`, user);

// deleting a user by id (Admin)
export const deleteUser = (id: number) => del<void>(`/user/${id}`);

// changing your own password
export const changePassword = (currentPassword: string, newPassword: string) =>
  post<void>("/user/me/password", { currentPassword, newPassword });
