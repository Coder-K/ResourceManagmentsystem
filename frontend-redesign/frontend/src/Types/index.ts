// Shared types and constants. Mirrors the shapes the C# API sends and receives.
// (tsconfig uses "erasableSyntaxOnly", so these are plain types and `as const` objects instead of enums.)

export type AccessLevel = 0 | 1 | 2;
export const ALL_LEVELS: AccessLevel[] = [0, 1, 2];
export const STAFF_LEVELS: AccessLevel[] = [1, 2]; // Manager + Admin
export const ACCESS_LABEL: Record<AccessLevel, string> = { 0: "Normal user", 1: "Manager", 2: "Admin" };

export type ProjectStatus = "Planning" | "Active" | "OnHold" | "Completed";
export const STATUS_LABEL: Record<ProjectStatus, string> = {
  Planning: "Planning",
  Active: "Active",
  OnHold: "On hold",
  Completed: "Completed",
};
export const STATUSES = Object.keys(STATUS_LABEL) as ProjectStatus[];

export const PASSWORD_HINT =
  "At least 10 characters, with upper and lower case letters, a number and a symbol.";
export const CONTACT_HINT = "10 to 15 digits, optional leading + (for example 0821234567).";
export const CONTACT_REGEX = /^\+?\d{10,15}$/;

export interface User {
  id: number;
  name: string;
  surname: string;
  email: string;
  contact: string;
  accessLevel: AccessLevel;
  isActive: boolean;
  createdUtc: string;
}

export interface LoginResponse {
  token: string;
  expiresUtc: string;
  idleTimeoutMinutes: number;
  user: User;
}

export interface NewUserInput {
  name: string;
  surname: string;
  email: string;
  contact: string;
  password: string;
  accessLevel: AccessLevel;
}

export interface UpdateUserInput {
  name: string;
  surname: string;
  email: string;
  contact: string;
  accessLevel?: AccessLevel;
  isActive?: boolean;
  newPassword?: string;
}

export interface Member {
  id: number;
  fullName: string;
}

export interface TempAccess {
  userId: number;
  fullName: string;
  expiresUtc: string;
}

export type AccessType = "Full" | "Assigned" | "Temporary" | "ViewOnly";

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progressPercent: number;
  isPriority: boolean;
  dueDate: string | null;
  updatedUtc: string;
  canEdit: boolean;
  accessType: AccessType;
  accessExpiresUtc: string | null;
  members: Member[];
  temporaryAccess: TempAccess[];
}

export interface NewProjectInput {
  name: string;
  description: string;
  dueDate: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  progressPercent?: number;
  dueDate?: string | null;
}

export interface Dashboard {
  totalProjects: number;
  runningProjects: number;
  completedProjects: number;
  overdueProjects: number;
  averageProgress: number;
  statusBreakdown: Record<string, number>;
  projects: Project[];
}
