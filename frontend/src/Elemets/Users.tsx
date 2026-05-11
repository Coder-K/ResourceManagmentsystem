import { useEffect, useState } from "react";
import {
  getUsers,
  addUser,
  deleteUser,
  updateUser,
} from "../Services/UserServices";

function Users() {
  const [users, setUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    accessLevel: 0,
  });

  // const [name, setName] = useState("");

  useEffect(() => {
    getUsers().then((data) => setUsers(data));
  }, []);

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddUser = (d: any) => {
    addUser(d).then((data) => {
      setUsers([...users, data]);
      setFormData({
        name: "",
        email: "",
        contact: "",
        password: "",
        accessLevel: 0,
      });
    });
  };

  const handleDeleteUser = (id: number) => {
    deleteUser(id).then(() => {
      setUsers(users.filter((u) => u.id !== id));
    });
  };

  const handleUpdateUser = (id: number) => {
    updateUser(id, formData).then((data) => {
      setUsers(users.map((u) => (u.id === id ? data : u)));
    });
  };
  return (
    <div>
      <h3>New User Details</h3>
      <ul>
        <li>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name"
          />
        </li>
        <li>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
          />
        </li>
        <li>
          <input
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Enter contact"
          />
        </li>
        <li>
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
        </li>
        <li>
          <input
            name="accessLevel"
            type="number"
            max={3}
            min={0}
            value={formData.accessLevel}
            onChange={handleChange}
            placeholder="Enter access level"
          />
        </li>

        <button onClick={handleAddUser}>Add User</button>
      </ul>
      <ul>
        {users.map((u: any) => (
          <li key={u.id}>
            {u.name}"/"
            {u.contact}"/"
            {u.email}"/"
            {u.accessLevel}
            <button onClick={() => handleDeleteUser(u.id)}>Delete</button>
            <button onClick={() => handleUpdateUser(u.id)}>Update</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Users;
