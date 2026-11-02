import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../Context/useAuth";
import { changePassword, getUserById, updateUser } from "../Services/UserServices";
import { errorMessage } from "../Services/ApiClient";
import { AccessBadge, Alert } from "../Components/ui";
import { ACCESS_LABEL, CONTACT_HINT, CONTACT_REGEX, PASSWORD_HINT } from "../Types";
import type { AccessLevel, UpdateUserInput, User } from "../Types";

interface Loaded {
  id: number;
  user?: User;
  error?: string;
}

// Used for both "My profile" (/user-details) and editing someone else (/user-details/:id).
function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const targetId = id ? Number(id) : (me?.id ?? 0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    getUserById(targetId)
      .then((u) => {
        if (!cancelled) setLoaded({ id: targetId, user: u });
      })
      .catch((e) => {
        if (!cancelled) setLoaded({ id: targetId, error: errorMessage(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  if (!me) return null;
  const current = loaded?.id === targetId ? loaded : null;
  if (!current) return <p className="muted">Loading…</p>;
  if (!current.user) return <Alert>{current.error}</Alert>;

  return (
    <UserForm
      key={current.user.id}
      target={current.user}
      me={me}
      isSelf={current.user.id === me.id}
      onSaved={(u) => setLoaded({ id: targetId, user: u })}
    />
  );
}

interface FormState {
  name: string;
  surname: string;
  email: string;
  contact: string;
  accessLevel: AccessLevel;
  isActive: boolean;
  newPassword: string;
}

function UserForm({ target, me, isSelf, onSaved }: { target: User; me: User; isSelf: boolean; onSaved: (u: User) => void }) {
  const { updateUser: setSignedInUser } = useAuth();
  const isAdmin = me.accessLevel === 2;
  // Mirrors the API rules (the API enforces them no matter what this page shows).
  const canEdit = isSelf || isAdmin || (me.accessLevel === 1 && target.accessLevel !== 2);

  const [form, setForm] = useState<FormState>({
    name: target.name,
    surname: target.surname,
    email: target.email,
    contact: target.contact,
    accessLevel: target.accessLevel,
    isActive: target.isActive,
    newPassword: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const text = (key: "name" | "surname" | "email" | "contact" | "newPassword") => (e: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const emailValid = /\S+@\S+\.\S+/.test(form.email);
  const contactValid = CONTACT_REGEX.test(form.contact);

  const save = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSaved("");
    if (!emailValid) return setError("Please enter a valid email address.");
    if (!contactValid) return setError(`Contact number is not valid. ${CONTACT_HINT}`);

    const body: UpdateUserInput = { name: form.name, surname: form.surname, email: form.email, contact: form.contact };
    if (isAdmin) body.accessLevel = form.accessLevel;
    if (isAdmin && !isSelf) {
      body.isActive = form.isActive;
      if (form.newPassword) body.newPassword = form.newPassword;
    }
    try {
      const updated = await updateUser(target.id, body);
      onSaved(updated);
      if (isSelf) setSignedInUser(updated); // keeps the sidebar name / level in sync
      setForm({ ...form, newPassword: "" });
      setSaved("Changes saved.");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <div className="pageHead">
        <h1>{isSelf ? "My profile" : `${target.name} ${target.surname}`}</h1>
        <p className="muted">
          <AccessBadge level={target.accessLevel} /> {!target.isActive && <span className="badge status-OnHold">Deactivated</span>}
        </p>
      </div>

      <div className="narrow stack">
        <form className="panel form" onSubmit={save}>
          <h2>Details</h2>
          <Alert>{error}</Alert>
          <Alert type="success">{saved}</Alert>
          {!canEdit && <Alert type="info">You can view this account but not edit it.</Alert>}

          <div className="twoCol">
            <label>
              Name
              <input value={form.name} onChange={text("name")} disabled={!canEdit} required maxLength={100} />
            </label>
            <label>
              Surname
              <input value={form.surname} onChange={text("surname")} disabled={!canEdit} required maxLength={100} />
            </label>
          </div>
          <label>
            Email
            <input type="email" value={form.email} onChange={text("email")} disabled={!canEdit} required />
          </label>
          <label>
            Contact number
            <input type="tel" value={form.contact} onChange={text("contact")} disabled={!canEdit} required />
            <span className="muted small">{CONTACT_HINT}</span>
          </label>

          {isAdmin ? (
            <label>
              Access level
              <select value={form.accessLevel} onChange={(e) => setForm({ ...form, accessLevel: Number(e.target.value) as AccessLevel })}>
                {([0, 1, 2] as AccessLevel[]).map((l) => (
                  <option key={l} value={l}>
                    {ACCESS_LABEL[l]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="muted small">Access level: {ACCESS_LABEL[target.accessLevel]} (only an admin can change it)</p>
          )}

          {isAdmin && !isSelf && (
            <>
              <label className="check">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Account is active
              </label>
              <label>
                Reset password (optional)
                <input type="password" value={form.newPassword} onChange={text("newPassword")} autoComplete="new-password" />
                <span className="muted small">{PASSWORD_HINT} The user is signed out everywhere.</span>
              </label>
            </>
          )}
          {canEdit && <button className="btn btnPrimary">Save changes</button>}
        </form>

        {isSelf && <ChangePassword />}
      </div>
    </>
  );
}

function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setOk("");
    if (next !== confirm) return setError("The new passwords do not match.");
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setOk("Password changed. Your other devices have been signed out.");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <form className="panel form" onSubmit={submit}>
      <h2>Change password</h2>
      <Alert>{error}</Alert>
      <Alert type="success">{ok}</Alert>
      <label>
        Current password
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />
      </label>
      <label>
        New password
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />
        <span className="muted small">{PASSWORD_HINT}</span>
      </label>
      <label>
        Confirm new password
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
      </label>
      <button className="btn">Change password</button>
    </form>
  );
}

export default UserDetails;
