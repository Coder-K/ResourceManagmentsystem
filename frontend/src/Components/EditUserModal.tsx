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
    surname: "",
    email: "",
    contact: "",
    passwordhash: "",
    accessLevel: 0,
  });

  // load selected user into form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        surname: user.surname,
        email: user.email,
        contact: user.contact,
        passwordhash: "",
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
    if (!emailValid) {
      alert("Please enter a valid email address");
      return;
    }

    if (!contactValid) {
      alert("Contact number must be exactly 10 digits");
      return;
    }
    if (formData.passwordhash == null || formData.passwordhash.trim() === "") {
      alert("Please enter a valid password");
      return;
    }

    updateUser(user.id, formData).then((data) => {
      onUserUpdated(data);
      onClose();
    });
  };

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

  const emailValid = /\S+@\S+\.\S+/.test(formData.email);
  const contactValid = /^\d{10}$/.test(formData.contact);

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
        name="surname"
        value={formData.surname}
        onChange={handleChange}
        placeholder="Enter surname"
      />

      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Email"
      />
      {!emailValid && <p style={{ color: "red" }}>Invalid email format</p>}

      <input
        name="contact"
        value={formData.contact}
        onChange={handleChange}
        placeholder="Contact"
      />
      {!contactValid && (
        <p style={{ color: "red" }}>Contact number must be exactly 10 digits</p>
      )}

      <input
        type="password"
        name="passwordhash"
        value={formData.passwordhash}
        onChange={handleChange}
        placeholder="New Password"
      />

      <br />
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

export default EditUserModal;
