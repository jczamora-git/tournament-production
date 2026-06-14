import { useState, useEffect } from "react";
import { adminGetTournaments, adminCreateTournament, adminUpdateTournament, adminDeleteTournament } from "../../../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

function ManageTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);

  const [formData, setFormData] = useState({
    name: "", slug: "", game_type: "MLBB", season: "", description: "",
    status: "upcoming", banner_url: "", logo_url: "", start_date: "", end_date: "", is_active: true
  });

  const fetchTournaments = () => {
    setLoading(true);
    adminGetTournaments()
      .then(setTournaments)
      .catch((err) => setToast({ message: err.message, type: "error" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleOpenForm = (tournament = null) => {
    if (tournament) {
      setEditingTournament(tournament);
      setFormData({
        name: tournament.name || "",
        slug: tournament.slug || "",
        game_type: tournament.game_type || "MLBB",
        season: tournament.season || "",
        description: tournament.description || "",
        status: tournament.status || "upcoming",
        banner_url: tournament.banner_url || "",
        logo_url: tournament.logo_url || "",
        start_date: tournament.start_date ? tournament.start_date.split('T')[0] : "",
        end_date: tournament.end_date ? tournament.end_date.split('T')[0] : "",
        is_active: tournament.is_active
      });
    } else {
      setEditingTournament(null);
      setFormData({
        name: "", slug: "", game_type: "MLBB", season: "", description: "",
        status: "upcoming", banner_url: "", logo_url: "", start_date: "", end_date: "", is_active: true
      });
    }
    setIsFormOpen(true);
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (!dataToSave.slug && dataToSave.name) {
      dataToSave.slug = generateSlug(dataToSave.name);
    }
    
    try {
      if (editingTournament) {
        await adminUpdateTournament(editingTournament.id, dataToSave);
        setToast({ message: "Tournament updated successfully", type: "success" });
      } else {
        await adminCreateTournament(dataToSave);
        setToast({ message: "Tournament created successfully", type: "success" });
      }
      setIsFormOpen(false);
      fetchTournaments();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tournament? This may affect associated videos.")) {
      try {
        await adminDeleteTournament(id);
        setToast({ message: "Tournament deleted successfully", type: "success" });
        fetchTournaments();
      } catch (err) {
        setToast({ message: err.message, type: "error" });
      }
    }
  };

  if (loading) return <LoadingState message="Loading tournaments..." />;

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Manage Tournaments</h1>
          <p className="admin-page-subtitle">Add, edit, and manage tournaments.</p>
        </div>
        <button className="button-primary" onClick={() => handleOpenForm()}>
          Add Tournament
        </button>
      </div>

      {isFormOpen ? (
        <div className="admin-card" style={{ marginBottom: "24px" }}>
          <div className="admin-card-title-row">
            <h2>{editingTournament ? "Edit Tournament" : "New Tournament"}</h2>
            <button className="button-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
          </div>
          <form onSubmit={handleSave} style={{ display: "grid", gap: "16px" }}>
            <div className="form-group">
              <label>Name</label>
              <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. SK Barangay MLBB Season 2" />
            </div>
            <div className="form-group">
              <label>Slug (Optional, auto-generated)</label>
              <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g. sk-mlbb-s2" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label>Game Type</label>
                <select value={formData.game_type} onChange={(e) => setFormData({ ...formData, game_type: e.target.value })}>
                  <option value="MLBB">MLBB</option>
                  <option value="HOK">HOK</option>
                  <option value="CODM">CODM</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Season</label>
              <input value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })} placeholder="e.g. Season 2" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}></textarea>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: "auto" }} />
              <label htmlFor="is_active" style={{ marginBottom: 0, cursor: "pointer" }}>Is Active (Visible)</label>
            </div>
            <button type="submit" className="button-primary">Save Tournament</button>
          </form>
        </div>
      ) : null}

      {!isFormOpen && tournaments.length === 0 ? (
        <EmptyState icon="🏆" title="No tournaments found" description="Create a tournament to get started." />
      ) : (
        <div className="admin-matches-list">
          {!isFormOpen && tournaments.map((t) => (
            <div key={t.id} className="admin-match-card">
              <div className="admin-match-header" style={{ justifyContent: "space-between" }}>
                <span className="admin-match-mode-pill">{t.game_type}</span>
                <span className={`status-badge is-${t.status === 'ongoing' ? 'live' : t.status === 'upcoming' ? 'pending' : 'completed'}`}>
                  {t.status.toUpperCase()}
                </span>
              </div>
              <div className="admin-match-body">
                <h3 style={{ margin: "0 0 8px 0" }}>{t.name}</h3>
                {t.season && <p className="admin-page-subtitle" style={{ margin: "0 0 8px 0" }}>{t.season}</p>}
                <p className="admin-page-subtitle" style={{ margin: 0 }}>{t.slug}</p>
                {!t.is_active && <p style={{ color: "#fca5a5", fontSize: "12px", marginTop: "8px" }}>Inactive</p>}
              </div>
              <div className="admin-match-controls">
                <button className="button-secondary" onClick={() => handleOpenForm(t)}>Edit</button>
                <button className="button-danger" onClick={() => handleDelete(t.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}

export default ManageTournaments;
