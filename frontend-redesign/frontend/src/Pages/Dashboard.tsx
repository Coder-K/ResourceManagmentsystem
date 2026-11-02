import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../Context/useAuth";
import { getDashboard } from "../Services/DashboardServices";
import { setPriority } from "../Services/ProjectServices";
import { errorMessage } from "../Services/ApiClient";
import { Alert, ProgressBar, StatusBadge } from "../Components/ui";
import { STATUS_LABEL } from "../Types";
import type { Dashboard as DashboardData } from "../Types";
import { fmtDate, isOverdue, timeLeft } from "../Utils/format";

function Dashboard() {
  const { user } = useAuth();
  const isStaff = (user?.accessLevel ?? 0) !== 0;
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(
    () =>
      getDashboard()
        .then((d) => {
          setData(d);
          setError("");
        })
        .catch((e) => setError(errorMessage(e))),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);

  const togglePriority = async (id: number, current: boolean) => {
    try {
      await setPriority(id, !current);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (!data) return error ? <Alert>{error}</Alert> : <p className="muted">Loading dashboard…</p>;
  const selected = data.projects.find((p) => p.id === selectedId);

  return (
    <>
      <div className="pageHead">
        <h1>Dashboard</h1>
        <p className="muted">{isStaff ? "Every project that is still in progress." : "Projects you are part of."}</p>
      </div>
      <Alert>{error}</Alert>

      <dl className="stats">
        <div>
          <dt>In progress</dt>
          <dd>{data.runningProjects}</dd>
        </div>
        <div>
          <dt>Average progress</dt>
          <dd>{data.averageProgress}%</dd>
        </div>
        <div>
          <dt>Overdue</dt>
          <dd className={data.overdueProjects ? "bad" : ""}>{data.overdueProjects}</dd>
        </div>
        <div>
          <dt>Completed</dt>
          <dd>{data.completedProjects}</dd>
        </div>
      </dl>

      <div className="grid2">
        <section className="panel">
          <h2>In progress</h2>
          {data.projects.length === 0 ? (
            <p className="muted">
              Nothing in progress. {isStaff ? "Projects appear here once an admin creates them." : "Ask a manager to add you to a project."}
            </p>
          ) : (
            <ul className="rows">
              {data.projects.map((p) => (
                <li key={p.id} className={p.id === selectedId ? "row selected" : "row"}>
                  <button className="rowMain" onClick={() => setSelectedId(p.id)} aria-pressed={p.id === selectedId}>
                    <span className="rowTitle">
                      {p.isPriority && <span className="flag">Priority</span>}
                      {p.name}
                    </span>
                    <ProgressBar value={p.progressPercent} />
                    <span className="rowMeta">
                      <StatusBadge status={p.status} />
                      <span className={isOverdue(p) ? "bad" : "muted"}>Due {fmtDate(p.dueDate)}</span>
                    </span>
                  </button>
                  {isStaff && (
                    <button className="btn btnGhost" onClick={() => togglePriority(p.id, p.isPriority)}>
                      {p.isPriority ? "Remove priority" : "Set priority"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="panel">
          {selected ? (
            <>
              <h2>{selected.name}</h2>
              <p>{selected.description || <span className="muted">No description.</span>}</p>
              <dl className="facts">
                <dt>Status</dt>
                <dd>{STATUS_LABEL[selected.status]}</dd>
                <dt>Progress</dt>
                <dd>{selected.progressPercent}%</dd>
                <dt>Due</dt>
                <dd>{fmtDate(selected.dueDate)}</dd>
                <dt>Last update</dt>
                <dd>{fmtDate(selected.updatedUtc)}</dd>
                <dt>Team</dt>
                <dd>{selected.members.map((m) => m.fullName).join(", ") || "Nobody assigned"}</dd>
                {selected.accessType === "Temporary" && selected.accessExpiresUtc && (
                  <>
                    <dt>Your access</dt>
                    <dd>Temporary, {timeLeft(selected.accessExpiresUtc)}</dd>
                  </>
                )}
                {isStaff && selected.temporaryAccess.length > 0 && (
                  <>
                    <dt>Temporary access</dt>
                    <dd>{selected.temporaryAccess.map((t) => `${t.fullName} (${timeLeft(t.expiresUtc)})`).join(", ")}</dd>
                  </>
                )}
              </dl>
            </>
          ) : (
            <p className="muted">Select a project to see its details.</p>
          )}
        </aside>
      </div>
    </>
  );
}

export default Dashboard;
