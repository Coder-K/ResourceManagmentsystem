import { useEffect, useState } from "react";
import { getUsers, deleteUser } from "../Services/UserServices";
import EditUserModal from "../Components/EditUserModal";
import "../App.css";

function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [showSearchPopup, setShowSearchPopup] = useState(false);

  useEffect(() => {
    getUsers().then((data) => setUsers(data));
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setShowSearchPopup(false);
  };

  const handleUserUpdated = (updatedUser: any) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleDeleteUser = (id: number) => {
    deleteUser(id).then(() => {
      setUsers(users.filter((u) => u.id !== id));
    });
  };

  return (
    <div>
      <h3> Users Details</h3>
      <div>
        <input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSearchPopup(true);
          }}
          placeholder="Search users..."
        />

        {showSearchPopup && searchTerm && (
          <div className="popupStyle">
            {filteredUsers.map((u: any) => (
              <div key={u.id}>
                {u.name} - {u.email}
                <button onClick={() => openEditModal(u)}>Edit</button>
              </div>
            ))}

            <button onClick={() => setShowSearchPopup(false)}>Close</button>
          </div>
        )}
      </div>
      <div className="table-container">
        <table className="userTable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Surname</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Access Level</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.surname}</td>
                <td>{u.contact}</td>
                <td>{u.email}</td>
                <td>{u.accessLevel}</td>
                <td>
                  <button onClick={() => handleDeleteUser(u.id)}>Delete</button>
                  <button onClick={() => openEditModal(u)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  );
}

export default Users;
