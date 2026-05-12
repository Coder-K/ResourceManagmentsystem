import { useEffect, useState } from "react";
import { getUsers, deleteUser } from "../Services/UserServices";
import EditUserModal from "../Components/EditUserModal";

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
  };

  const handleUserUpdated = (updatedUser: any) => {
    setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
  };

  const handleDeleteUser = (id: number) => {
    deleteUser(id).then(() => {
      setUsers(users.filter((u) => u.id !== id));
    });
  };

  const popupStyle = {
    position: "fixed" as const,
    top: "20%",
    right: "20px",
    background: "white",
    border: "1px solid black",
    padding: "10px",
    zIndex: 1000,
  };

  return (
    <div>
      <h3> Users Details</h3>

      <input
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowSearchPopup(true);
        }}
        placeholder="Search users..."
      />

      {showSearchPopup && searchTerm && (
        <div style={popupStyle}>
          {filteredUsers.map((u: any) => (
            <div key={u.id}>
              {u.name} - {u.email}
              <button onClick={() => openEditModal(u)}>Edit</button>
            </div>
          ))}

          <button onClick={() => setShowSearchPopup(false)}>Close</button>
        </div>
      )}

      <ul>
        {users.map((u: any) => (
          <li key={u.id}>
            {u.name}"/"
            {u.surname}"/"
            {u.contact}"/"
            {u.email}"/"
            {u.accessLevel}
            <button onClick={() => handleDeleteUser(u.id)}>Delete</button>
            <button onClick={() => openEditModal(u)}>Edit</button>
            {selectedUser && (
              <EditUserModal
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
                onUserUpdated={handleUserUpdated}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Users;
