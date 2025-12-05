import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ViewerPage from "./pages/ViewerPage";
import StreamSettingsPage from "./pages/StreamSettingsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ViewerPage />} />
        <Route path="/admin/stream-settings" element={<StreamSettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
