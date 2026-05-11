import { useEffect, useState } from "react";
import { getUserById, updateUser } from "../Services/UserServices";

function UserDetails() {
  const [user, setUser] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    getUserById(1).then((data) => setUser([data]));
  }, []);

  const handleUpdateUser = (id: number) => {
    updateUser(id, { name }).then((data) => {
      setUser(user.map((u) => (u.id === id ? data : u)));
    });
  };

  return (
    <div>
      <ul>
        <li>{user[0]?.name}</li>
      </ul>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={user[0]?.name || "Detail not found"}
      />
      <button onClick={() => handleUpdateUser(1)}>Update User</button>
    </div>
  );
}

export default UserDetails;
