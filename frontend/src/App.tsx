import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("https://localhost:44372/api/user")
      .then((res) => {
        console.log("STATUS:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("DATA:", data);
        setUsers(data);
      })
      .catch((err) => console.log("ERROR:", err));
  }, []);
  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>

        <h2>Users from API:</h2>
        <ul>
          {users.map((u: any) => (
            <li key={u.id}>{u.name}</li>
          ))}
        </ul>

        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>
    </>
  );
}

export default App;
