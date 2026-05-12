import { useEffect, useState } from "react";
import { getUserById, updateUser } from "../Services/UserServices";

function UserDetails() {
  const [user, setUser] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    id: 0,
    name: "",
    surname: "",
    email: "",
    contact: "",
    accessLevel: 0,
  });
  useEffect(() => {
    getUserById(1).then((data) => setUser([data]));
  }, []);

  const handleUpdateUser = (id: number) => {
    updateUser(id, formData).then((data) => {
      setUser(user.map((u) => (u.id === id ? data : u)));
    });
  };

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlegetUserById = (id: number) => {
    getUserById(id).then((data) => setUser([data]));
  };

  return (
    <div>
      <input
        name="id"
        value={formData.id}
        onChange={handleChange}
        placeholder="Enter user id"
      />
      <button onClick={() => handlegetUserById(formData.id)}>Get User</button>

      <h3>User Details</h3>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder={formData.name}
      />
      <input
        name="surname"
        value={formData.surname}
        onChange={handleChange}
        placeholder={formData.surname}
      />
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder={formData.email}
      />
      <input
        name="contact"
        value={formData.contact}
        onChange={handleChange}
        placeholder={formData.contact}
      />

      <input
        name="accessLevel"
        type="number"
        max={3}
        min={0}
        value={formData.accessLevel}
        onChange={handleChange}
        placeholder={formData.accessLevel.toString()}
      />
      {/* <button onClick={() => handleUpdateUser(1)}>Update User</button> */}
    </div>
  );
}

export default UserDetails;
