import { useEffect, useState } from "react";
import { getUsers, addUser, deleteUser } from "../Services/UserServices";

function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    getUsers().then((data) => setUsers(data));
  }, []);

  const handleAddUser = () => {
    addUser({ name }).then((data) => {
      setUsers([...users, data]);
      setName("");
    });
  };

  const handleDeleteUser = (id: number) => {
    deleteUser(id).then(() => {
      setUsers(users.filter((u) => u.id !== id));
    });
  };

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />
      <button onClick={handleAddUser}>Add User</button>
      <ul>
        {users.map((u: any) => (
          <li key={u.id}>
            {u.name}
            <button onClick={() => handleDeleteUser(u.id)}>Delete</button>
          </li>
        ))}
      </ul>{" "}
    </div>
  );
}

export default Users;
