import { Routes, Route } from "react-router-dom";
import PublicTopNav from "./components/PublicTopNav";
import PublicHome from "./pages/PublicHome";
import UploadTeam from "./pages/UploadTeam";
import ViewMatches from "./pages/ViewMatches";
import ViewHistory from "./pages/ViewHistory";
import ViewBracket from "./pages/ViewBracket";

function PublicApp() {
  return (
    <div className="admin-app">
      <PublicTopNav />
      <main className="admin-shell">
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/upload-team" element={<UploadTeam />} />
          <Route path="/matches" element={<ViewMatches />} />
          <Route path="/history" element={<ViewHistory />} />
          <Route path="/bracket" element={<ViewBracket />} />
        </Routes>
      </main>
    </div>
  );
}

export default PublicApp;
