import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ViewerPage from "./pages/ViewerPage";
import StreamSettingsPage from "./pages/StreamSettingsPage";
import GioiThieuPage from "./pages/GioiThieuPage";
import QuyDinhPage from "./pages/QuyDinhPage";
import LienHePage from "./pages/LienHePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ViewerPage />} />
        <Route path="/gioi-thieu" element={<GioiThieuPage />} />
        <Route path="/quy-dinh" element={<QuyDinhPage />} />
        <Route path="/lien-he" element={<LienHePage />} />
        <Route path="/admin/stream-settings" element={<StreamSettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
