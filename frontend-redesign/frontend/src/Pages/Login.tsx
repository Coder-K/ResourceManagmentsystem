import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../Context/useAuth";
import { Alert } from "../Components/ui";
import { errorMessage } from "../Services/ApiClient";

// Standalone page (no sidebar). Signed-in users cannot see it: they are sent back into the app.
function Login() {
  const { user, ready, notice, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!ready) return <p className="center muted">Loading…</p>;
  if (user) {
    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  // handling login: the token is stored by AuthProvider (sessionStorage), not here
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="loginWrap">
      <form className="loginCard" onSubmit={handleLogin}>
        <h1>RMS</h1>
        <p className="muted">Sign in to track your team's projects.</p>

        <Alert type="info">{notice}</Alert>
        <Alert>{error}</Alert>

        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <button className="btn btnPrimary" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export default Login;
