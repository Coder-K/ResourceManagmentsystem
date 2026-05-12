import { useState, useEffect } from "react";
import { updateUser } from "../Services/UserServices";

type Props = {
  user: any;
  onClose: () => void;
  onUserUpdated: (updatedUser: any) => void;
};

function EditUserModal({ user, onClose, onUserUpdated }: Props) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    accessLevel: 0,
  });

  // load selected user into form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        contact: user.contact,
        password: "",
        accessLevel: user.accessLevel,
      });
    }
  }, [user]);

  const handleChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = () => {
    updateUser(user.id, formData).then((data) => {
      onUserUpdated(data);
      onClose();
    });
  };

  return (
    <div style={modalStyle}>
      <h2>Edit User</h2>

      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
      />

      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />

      <input
        name="contact"
        value={formData.contact}
        onChange={handleChange}
        placeholder="Contact"
      />

      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        placeholder="New Password"
      />

      <label>Access Level:</label>
      <input
        type="number"
        name="accessLevel"
        min={0}
        max={3}
        value={formData.accessLevel}
        onChange={handleChange}
        placeholder="Access Level"
      />

      <br />

      <button onClick={handleSubmit}>Save Changes</button>

      <button onClick={onClose}>Cancel</button>
    </div>
  );
}

const modalStyle = {
  position: "fixed" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  background: "white",
  padding: "20px",
  border: "1px solid black",
  zIndex: 1000,
};

export default EditUserModal;
