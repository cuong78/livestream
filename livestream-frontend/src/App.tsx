import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ViewerPage from "./pages/ViewerPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ViewerPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;
