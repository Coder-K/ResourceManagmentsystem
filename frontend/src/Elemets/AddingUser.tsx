import { useState, useEffect } from "react";
import { addUser } from "../Services/UserServices";

function AddingUser() {
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    contact: "",
    passwordhash: "",
    AccessLevel: 0,
  });

  const handleAddUser = () => {
    if (!emailValid) {
      alert("Please enter a valid email address");
      return;
    }

    if (!contactValid) {
      alert("Contact number must be exactly 10 digits");
      return;
    }
    addUser(formData)
      .then((data) => {
        setUsers([...users, data]);
        setFormData({
          name: "",
          surname: "",
          email: "",
          contact: "",
          passwordhash: "",
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

  const emailValid = /\S+@\S+\.\S+/.test(formData.email);
  const contactValid = /^\d{10}$/.test(formData.contact);

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
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            placeholder="Enter surname"
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
            type="password"
            name="passwordhash"
            value={formData.passwordhash}
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
