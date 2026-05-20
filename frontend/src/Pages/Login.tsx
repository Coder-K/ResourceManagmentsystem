import { useState } from "react";
import { login } from "../Services/UserServices";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  //handling login and storing token in localStorage
  const handleLogin = () => {
    login(email, password)
      .then((data) => {
        console.log("TOKEN:", data.token);

        localStorage.setItem("token", data.token);
      })
      .catch((err) => console.log(err));
  };
  return (
    <>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
      />
      <button onClick={handleLogin}>Login</button>
    </>
  );
}
export default Login;
