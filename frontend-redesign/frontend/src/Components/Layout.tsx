import { Outlet } from "react-router-dom";
import Nav from "./Navbar";

/** Shell for every logged-in page. The login page deliberately does NOT use this. */
export default function Layout() {
  return (
    <>
      <Nav />
      <div className="mainContent">
        <Outlet />
      </div>
    </>
  );
}
