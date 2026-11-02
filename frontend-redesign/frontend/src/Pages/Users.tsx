import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../Context/useAuth";
import { deleteUser, getUsers } from "../Services/UserServices";
import { errorMessage } from "../Services/ApiClient";
import { AccessBadge, Alert } from "../Components/ui";
import type { User } from "../Types";

function Users() {
  const { user: me } = useAuth();
  const isAdmin = me?.accessLevel === 2;
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const filteredUsers = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return (users ?? []).filter((u) => !s || `${u.name} ${u.surname} ${u.email}`.toLowerCase().includes(s));
  }, [users, searchTerm]);

  const handleDeleteUser = async (u: User) => {
    if (!window.confirm(`Delete ${u.name} ${u.surname}? This cannot be undone.`)) return;
    try {
      await deleteUser(u.id);
      setUsers((list) => (list ?? []).filter((x) => x.id !== u.id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <div className="pageHead split">
        <div>
          <h1>All users</h1>
          <p className="muted">{users ? `${users.length} accounts` : ""}</p>
        </div>
        <Link className="btn btnPrimary" to="/add-user">
          Register user
        </Link>
      </div>
      <Alert>{error}</Alert>

      <div className="panel">
        <input
          className="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          aria-label="Search users"
        />
        {!users ? (
          <p className="muted">Loading…</p>
        ) : (
          <div className="tableContainer">
            <table className="userTable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Surname</th>
                  <th>Contact</th>
                  <th>Email</th>
                  <th>Access level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const editable = isAdmin || u.accessLevel !== 2 || u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.surname}</td>
                      <td>{u.contact}</td>
                      <td>{u.email}</td>
                      <td>
                        <AccessBadge level={u.accessLevel} />
                      </td>
                      <td>{u.isActive ? "Active" : <span className="bad">Deactivated</span>}</td>
                      <td className="actions">
                        <Link to={u.id === me?.id ? "/user-details" : `/user-details/${u.id}`}>{editable ? "Edit" : "View"}</Link>
                        {isAdmin && u.id !== me?.id && (
                          <button className="btn btnGhost btnDangerText" onClick={() => handleDeleteUser(u)}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      No users match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default Users;
