import type { Project } from "../Types";

export const fmtDate = (d: string | null | undefined): string =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "No date";

export function timeLeft(expiresUtc: string): string {
  const ms = new Date(expiresUtc).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
}

export const isOverdue = (p: Project): boolean =>
  p.status !== "Completed" && !!p.dueDate && new Date(p.dueDate).getTime() < Date.now();
