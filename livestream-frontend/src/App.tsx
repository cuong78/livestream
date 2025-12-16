import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ViewerPage from "./pages/ViewerPage";
import StreamSettingsPage from "./pages/StreamSettingsPage";
import GioiThieuPage from "./pages/GioiThieuPage";
import QuyDinhPage from "./pages/QuyDinhPage";
import VideoPage from "./pages/VideoPage";
import LienHePage from "./pages/LienHePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ViewerPage />} />
        <Route path="/gioi-thieu" element={<GioiThieuPage />} />
        <Route path="/quy-dinh" element={<QuyDinhPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/lien-he" element={<LienHePage />} />
        <Route path="/admin/stream-settings" element={<StreamSettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
