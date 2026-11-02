import { NavLink } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../Context/useAuth";
import { ACCESS_LABEL, ALL_LEVELS, STAFF_LEVELS } from "../Types";
import type { AccessLevel } from "../Types";
import "./ComStyle.css";

// One list drives the whole menu: a link is only rendered when the user's access level is listed.
const LINKS: { to: string; label: string; levels: AccessLevel[] }[] = [
  { to: "/", label: "Dashboard", levels: ALL_LEVELS },
  { to: "/projects", label: "Projects", levels: ALL_LEVELS },
  { to: "/users", label: "All users", levels: STAFF_LEVELS },
  { to: "/add-user", label: "Register user", levels: STAFF_LEVELS },
  { to: "/user-details", label: "My profile", levels: ALL_LEVELS },
];

function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  if (!user) return null;

  const visible = LINKS.filter((l) => l.levels.includes(user.accessLevel));

  return (
    <>
      <button className="menuButton" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
        ☰
      </button>

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="logoSection">
          <h2>RMS</h2>
        </div>

        {/* Signed-in user: name and access level */}
        <div className="userSection">
          <div className="userIcon">👤</div>
          <div>
            <div className="userName">
              {user.name} {user.surname}
            </div>
            <div className="userRole">{ACCESS_LABEL[user.accessLevel]}</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="navLinks" aria-label="Main">
          {visible.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end
              className={({ isActive }) => `navItem ${isActive ? "active" : ""}`}
              onClick={() => setIsOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button className="signOut" onClick={logout}>
          Sign out
        </button>
      </div>
    </>
  );
}

export default Nav;
