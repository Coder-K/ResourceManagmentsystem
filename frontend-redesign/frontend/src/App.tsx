import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./Context/AuthProvider";
import Layout from "./Components/Layout";
import ProtectedRoute from "./Components/ProtectedRoute";
import Login from "./Pages/Login";
import Dashboard from "./Pages/Dashboard";
import Projects from "./Pages/Projects";
import Users from "./Pages/Users";
import UserDetails from "./Pages/UserDetails";
import AddingUser from "./Pages/AddingUser";
import { STAFF_LEVELS } from "./Types";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Standalone: no sidebar. Signed-in users are sent back into the app by the Login page itself. */}
          <Route path="/login" element={<Login />} />

          {/* Everything else needs a valid login and shows the sidebar */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="user-details" element={<UserDetails />} />
            <Route
              path="user-details/:id"
              element={
                <ProtectedRoute levels={STAFF_LEVELS}>
                  <UserDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute levels={STAFF_LEVELS}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="add-user"
              element={
                <ProtectedRoute levels={STAFF_LEVELS}>
                  <AddingUser />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
