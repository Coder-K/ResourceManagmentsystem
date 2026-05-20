import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import Login from "./Pages/Login";
import Users from "./Pages/Users";
import UserDetails from "./Pages/UserDetails";
import AddingUser from "./Pages/AddingUser";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Nav from "./Components/Navbar";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <div className="mainContent">
        {" "}
        <Routes>
          <Route path="/users" element={<Users />} />
          <Route path="/user-details" element={<UserDetails />} />
          <Route path="/add-user" element={<AddingUser />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
  //     <section id="center">
  //       <div className="hero">
  //         <img src={heroImg} className="base" width="170" height="179" alt="" />
  //         <img src={reactLogo} className="framework" alt="React logo" />
  //         <img src={viteLogo} className="vite" alt="Vite logo" />
  //       </div>
  //       {/* <Login /> */}
  //       <Users />
  //       {/* <UserDetails /> */}
  //       <AddingUser />
  //     </section>
  //   </>
  // );
}

export default App;
