import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import Login from "./Elemets/Login";
import Users from "./Elemets/Users";
import UserDetails from "./Elemets/UserDetails";
import AddingUser from "./Elemets/AddingUser";
import "./App.css";

function App() {
  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        {/* <Login /> */}
        <Users />
        {/* <UserDetails /> */}
        <AddingUser />
      </section>
    </>
  );
}

export default App;
