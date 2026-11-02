import type { ReactNode } from "react";
import { ACCESS_LABEL, STATUS_LABEL } from "../Types";
import type { AccessLevel, ProjectStatus } from "../Types";

/** Segmented "build meter" progress bar. */
export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="meterRow">
      <div className="meter" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
        <div className="meterFill" style={{ width: `${value}%` }} />
      </div>
      <span className="pct">{value}%</span>
    </div>
  );
}

export function Alert({ type = "error", children }: { type?: "error" | "info" | "success"; children?: ReactNode }) {
  if (!children) return null;
  return (
    <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

export const StatusBadge = ({ status }: { status: ProjectStatus }) => (
  <span className={`badge status-${status}`}>{STATUS_LABEL[status]}</span>
);

export const AccessBadge = ({ level }: { level: AccessLevel }) => (
  <span className={`badge level-${level}`}>{ACCESS_LABEL[level]}</span>
);
