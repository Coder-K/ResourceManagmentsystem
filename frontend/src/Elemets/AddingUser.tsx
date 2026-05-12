import { useState, useEffect } from "react";
import { addUser, updateUser } from "../Services/UserServices";

function AddingUser() {
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    AccessLevel: 0,
  });

  const handleAddUser = () => {
    addUser(formData)
      .then((data) => {
        setUsers([...users, data]);
        setFormData({
          name: "",
          email: "",
          contact: "",
          password: "",
          AccessLevel: 0,
        });
      })
      .catch((err) => console.log(err));
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
            name="AccessLevel"
            type="number"
            max={3}
            min={0}
            value={formData.AccessLevel}
            onChange={handleChange}
            placeholder="Enter access level"
          />
        </li>

        <button onClick={handleAddUser}>Add User</button>
      </ul>
    </div>
  );
}

export default AddingUser;
