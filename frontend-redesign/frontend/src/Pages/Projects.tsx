import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../Context/useAuth";
import {
  addProject,
  deleteProject,
  getProjects,
  grantAccess,
  revokeAccess,
  setMembers as saveMembers,
  setPriority,
  updateProject,
} from "../Services/ProjectServices";
import { getUsers } from "../Services/UserServices";
import { errorMessage } from "../Services/ApiClient";
import { Alert, ProgressBar, StatusBadge } from "../Components/ui";
import { STATUSES, STATUS_LABEL } from "../Types";
import type {
  Project,
  ProjectStatus,
  UpdateProjectInput,
  User,
} from "../Types";
import { fmtDate, timeLeft } from "../Utils/format";

function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.accessLevel === 2;
  const isStaff = (user?.accessLevel ?? 0) !== 0;

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getProjects(),
      isStaff ? getUsers() : Promise.resolve([] as User[]),
    ])
      .then(([p, u]) => {
        if (cancelled) return;
        setProjects(p);
        setUsers(u);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isStaff]);

  const replace = (p: Project) =>
    setProjects((list) => list.map((x) => (x.id === p.id ? p : x)));
  const select = (id: number) => {
    setSelectedId(id);
    setError("");
    setNotice("");
  };
  const selected = projects.find((p) => p.id === selectedId);

  return (
    <>
      <div className="pageHead split">
        <div>
          <h1>Projects</h1>
          <p className="muted">
            {isStaff ? "All projects." : "Projects you can work on."}
          </p>
        </div>
        {(isAdmin || isStaff) && (
          <button
            className="btn btnPrimary"
            onClick={() => setCreating((c) => !c)}
          >
            {creating ? "Cancel" : "New project"}
          </button>
        )}
      </div>
      <Alert>{error}</Alert>
      <Alert type="success">{notice}</Alert>

      {creating && (
        <NewProject
          onError={setError}
          onCreated={(p) => {
            setProjects((l) => [p, ...l]);
            select(p.id);
            setCreating(false);
          }}
        />
      )}

      <div className="grid2">
        <section className="panel">
          {!loaded ? (
            <p className="muted">Loading…</p>
          ) : projects.length === 0 ? (
            <p className="muted">No projects yet.</p>
          ) : (
            <ul className="rows">
              {projects.map((p) => (
                <li
                  key={p.id}
                  className={p.id === selectedId ? "row selected" : "row"}
                >
                  <button className="rowMain" onClick={() => select(p.id)}>
                    <span className="rowTitle">
                      {p.isPriority && <span className="flag">Priority</span>}
                      {p.name}
                    </span>
                    <ProgressBar value={p.progressPercent} />
                    <span className="rowMeta">
                      <StatusBadge status={p.status} />
                      <span className="muted">
                        {p.accessType === "Temporary" && p.accessexpire
                          ? `Temporary, ${timeLeft(p.accessexpire)}`
                          : p.accessType === "ViewOnly"
                            ? "View only"
                            : "You can edit"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          {selected ? (
            // The key makes the editor start fresh whenever the server returns an updated project.
            <Editor
              key={`${selected.id}-${selected.updatedUtc}`}
              project={selected}
              users={users}
              isAdmin={isAdmin}
              isStaff={isStaff}
              onChange={replace}
              onError={setError}
              onNotice={setNotice}
              onDeleted={() => {
                setProjects((l) => l.filter((x) => x.id !== selected.id));
                setSelectedId(null);
              }}
            />
          ) : (
            <div className="panel">
              <p className="muted">Select a project to view or edit it.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function NewProject({
  onCreated,
  onError,
}: {
  onCreated: (p: Project) => void;
  onError: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      onError("");
      onCreated(
        await addProject({
          name,
          description,
          dueDate: dueDate ? `${dueDate}T00:00:00Z` : null,
        }),
      );
    } catch (err) {
      onError(errorMessage(err));
    }
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>New project</h2>
      <label>
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          maxLength={150}
        />
      </label>
      <label>
        Description
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
      </label>
      <label>
        Due date
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>
      <button className="btn btnPrimary">Create project</button>
    </form>
  );
}

interface FormState {
  name: string;
  description: string;
  status: ProjectStatus;
  progressPercent: number;
  dueDate: string;
}

const toForm = (p: Project): FormState => ({
  name: p.name,
  description: p.description ?? "",
  status: p.status,
  progressPercent: p.progressPercent,
  dueDate: p.dueDate ? p.dueDate.slice(0, 10) : "",
});

interface EditorProps {
  project: Project;
  users: User[];
  isAdmin: boolean;
  isStaff: boolean;
  onChange: (p: Project) => void;
  onDeleted: () => void;
  onError: (m: string) => void;
  onNotice: (m: string) => void;
}

function Editor({
  project,
  users,
  isAdmin,
  isStaff,
  onChange,
  onDeleted,
  onError,
  onNotice,
}: EditorProps) {
  const [form, setForm] = useState<FormState>(() => toForm(project));
  const [members, setMembers] = useState<number[]>(() =>
    project.members.map((m) => m.id),
  );
  const [grantee, setGrantee] = useState("");

  // runs an API call that returns the updated project
  const run = async (fn: () => Promise<Project>, okMessage?: string) => {
    try {
      onError("");
      onNotice("");
      onChange(await fn());
      if (okMessage) onNotice(okMessage);
    } catch (e) {
      onError(errorMessage(e));
    }
  };

  const save = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Non-admins may only send these three fields. The API enforces it too.
    const body: UpdateProjectInput = {
      description: form.description,
      status: form.status,
      progressPercent: form.progressPercent,
    };
    if (isAdmin || isStaff) {
      body.name = form.name;
      body.dueDate = form.dueDate ? `${form.dueDate}T00:00:00Z` : null;
    }
    run(() => updateProject(project.id, body), "Changes saved.");
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`))
      return;
    try {
      await deleteProject(project.id);
      onDeleted();
    } catch (e) {
      onError(errorMessage(e));
    }
  };

  const candidates = users.filter(
    (u) =>
      u.accessLevel === 0 &&
      u.isActive &&
      !project.members.some((m) => m.id === u.id) &&
      !project.temporaryAccess.some((t) => t.userId === u.id),
  );
  const readOnly = !project.canEdit;

  return (
    <div className="stack">
      <form className="panel form" onSubmit={save}>
        <div className="split">
          <h2>{project.name}</h2>
          {isStaff && (
            <button
              type="button"
              className="btn btnGhost"
              onClick={() =>
                run(() => setPriority(project.id, !project.isPriority))
              }
            >
              {project.isPriority ? "Remove priority" : "Set priority"}
            </button>
          )}
        </div>
        {readOnly && (
          <Alert type="info">You can view this project but not edit it.</Alert>
        )}
        {project.accessType === "Temporary" && project.accessexpire && (
          <Alert type="info">
            Temporary access: {timeLeft(project.accessexpire)}.
          </Alert>
        )}

        <label>
          Name
          <input
            value={form.name}
            disabled={!isAdmin}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Description
          <textarea
            rows={4}
            value={form.description}
            disabled={readOnly}
            maxLength={2000}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="twoCol">
          <label>
            Status
            <select
              value={form.status}
              disabled={readOnly}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ProjectStatus })
              }
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={form.dueDate}
              disabled={!isAdmin}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </label>
        </div>
        <label>
          Progress: {form.progressPercent}%
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={form.progressPercent}
            disabled={readOnly}
            onChange={(e) =>
              setForm({ ...form, progressPercent: Number(e.target.value) })
            }
          />
        </label>
        {!readOnly && <button className="btn btnPrimary">Save changes</button>}
        <p className="muted small">
          Last updated {fmtDate(project.updatedUtc)}
        </p>
      </form>

      {(isAdmin || isStaff) && (
        <div className="panel form">
          <h3>Team members</h3>
          <div className="checks">
            {users
              .filter((u) => u.isActive)
              .map((u) => (
                <label key={u.id} className="check">
                  <input
                    type="checkbox"
                    checked={members.includes(u.id)}
                    onChange={(e) =>
                      setMembers(
                        e.target.checked
                          ? [...members, u.id]
                          : members.filter((x) => x !== u.id),
                      )
                    }
                  />
                  {u.name} {u.surname}
                </label>
              ))}
          </div>
          <button
            className="btn"
            onClick={() =>
              run(() => saveMembers(project.id, members), "Team updated.")
            }
          >
            Save team
          </button>
        </div>
      )}

      {isStaff && (
        <div className="panel form">
          <h3>Temporary access (4 days)</h3>
          {project.temporaryAccess.length === 0 ? (
            <p className="muted">Nobody has temporary access.</p>
          ) : (
            <ul className="plain">
              {project.temporaryAccess.map((t) => (
                <li key={t.userId} className="split">
                  <span>
                    {t.fullName}{" "}
                    <span className="muted">({timeLeft(t.expire)})</span>
                  </span>
                  <button
                    className="btn btnGhost"
                    onClick={() =>
                      run(() => revokeAccess(project.id, t.userId))
                    }
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="inline">
            <select
              value={grantee}
              onChange={(e) => setGrantee(e.target.value)}
              aria-label="User to grant access"
            >
              <option value="">Choose a normal user…</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.surname}
                </option>
              ))}
            </select>
            <button
              className="btn"
              disabled={!grantee}
              onClick={() =>
                run(async () => {
                  const r = await grantAccess(project.id, Number(grantee));
                  setGrantee("");
                  return r;
                })
              }
            >
              Grant access
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <button className="btn btnDanger" onClick={remove}>
          Delete project
        </button>
      )}
    </div>
  );
}

export default Projects;
