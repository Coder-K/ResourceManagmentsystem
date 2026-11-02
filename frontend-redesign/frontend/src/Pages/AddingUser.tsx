import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/useAuth";
import { addUser } from "../Services/UserServices";
import { errorMessage } from "../Services/ApiClient";
import { Alert } from "../Components/ui";
import { ACCESS_LABEL, CONTACT_HINT, CONTACT_REGEX, PASSWORD_HINT } from "../Types";
import type { AccessLevel } from "../Types";

function AddingUser() {
  const { user: me } = useAuth();
  const navigate = useNavigate();
  const isAdmin = me?.accessLevel === 2;

  const [formData, setFormData] = useState({ name: "", surname: "", email: "", contact: "", password: "" });
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const text = (key: keyof typeof formData) => (e: ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [key]: e.target.value });

  const emailValid = /\S+@\S+\.\S+/.test(formData.email);
  const contactValid = CONTACT_REGEX.test(formData.contact);

  const handleAddUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!emailValid) return setError("Please enter a valid email address.");
    if (!contactValid) return setError(`Contact number is not valid. ${CONTACT_HINT}`);

    setBusy(true);
    try {
      // managers can only create Normal users; the API enforces this as well
      await addUser({ ...formData, accessLevel: isAdmin ? accessLevel : 0 });
      navigate("/users");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="pageHead">
        <h1>New user details</h1>
        <p className="muted">{isAdmin ? "Create an account with any access level." : "Accounts created by managers are normal users."}</p>
      </div>
      <form className="panel form narrow" onSubmit={handleAddUser}>
        <Alert>{error}</Alert>
        <div className="twoCol">
          <label>
            Name
            <input value={formData.name} onChange={text("name")} placeholder="Enter name" required maxLength={100} />
          </label>
          <label>
            Surname
            <input value={formData.surname} onChange={text("surname")} placeholder="Enter surname" required maxLength={100} />
          </label>
        </div>
        <label>
          Email
          <input type="email" value={formData.email} onChange={text("email")} placeholder="Enter email" required />
        </label>
        <label>
          Contact number
          <input type="tel" value={formData.contact} onChange={text("contact")} placeholder="Enter contact" required />
          <span className="muted small">{CONTACT_HINT}</span>
        </label>
        <label>
          Temporary password
          <input type="password" value={formData.password} onChange={text("password")} placeholder="Enter password" required autoComplete="new-password" />
          <span className="muted small">{PASSWORD_HINT} The user can change it after signing in.</span>
        </label>
        {isAdmin && (
          <label>
            Access level
            <select value={accessLevel} onChange={(e) => setAccessLevel(Number(e.target.value) as AccessLevel)}>
              {([0, 1, 2] as AccessLevel[]).map((l) => (
                <option key={l} value={l}>
                  {ACCESS_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className="btn btnPrimary" disabled={busy}>
          {busy ? "Creating…" : "Add user"}
        </button>
      </form>
    </>
  );
}

export default AddingUser;
