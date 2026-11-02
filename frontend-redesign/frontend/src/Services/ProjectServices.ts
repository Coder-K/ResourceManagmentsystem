import { del, get, post, put } from "./ApiClient";
import type { NewProjectInput, Project, UpdateProjectInput } from "../Types";

export const getProjects = () => get<Project[]>("/project");
export const addProject = (p: NewProjectInput) => post<Project>("/project", p);
export const updateProject = (id: number, p: UpdateProjectInput) => put<Project>(`/project/${id}`, p);
export const deleteProject = (id: number) => del<void>(`/project/${id}`);
export const setPriority = (id: number, isPriority: boolean) =>
  put<Project>(`/project/${id}/priority`, { isPriority });
export const setMembers = (id: number, userIds: number[]) =>
  put<Project>(`/project/${id}/members`, { userIds });
export const grantAccess = (id: number, userId: number) =>
  post<Project>(`/project/${id}/temp-access`, { userId });
export const revokeAccess = (id: number, userId: number) =>
  del<Project>(`/project/${id}/temp-access/${userId}`);
