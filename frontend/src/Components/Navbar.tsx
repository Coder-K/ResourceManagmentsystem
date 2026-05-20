import { Link } from "react-router-dom";
import { useState } from "react";
import "./ComStyle.css";

function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button className="menuButton" onClick={() => setIsOpen(!isOpen)}>
        {" "}
        ☰{" "}
      </button>

      <div className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="logoSection">
          <h2>RMS</h2>
        </div>

        {/* User Info */}
        <div className="userSection">
          <div className="userIcon">👤</div>
          <span>John Doe</span>
        </div>

        {/* Navigation Links */}
        <div className="navLinks">
          <Link to="/" className="navItem">
            Dashboard
          </Link>

          <Link to="/users" className="navItem">
            Users
          </Link>

          <Link to="/add-user" className="navItem">
            Add User
          </Link>

          <div className="navItem disabled">Inventory</div>

          <div className="navItem disabled">Reports</div>
        </div>
      </div>
    </>
  );
}

export default Nav;
