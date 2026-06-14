import { useState, useEffect } from "react";
import { adminGetVideos, adminCreateVideo, adminUpdateVideo, adminDeleteVideo, adminGetTournaments } from "../../../services/api";
import { buildEmbedUrl } from "../../../utils/embed";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

function ManageVideos() {
  const [videos, setVideos] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  const [formData, setFormData] = useState({
    tournament_id: "", title: "", description: "", source_type: "google_drive", source_url: "",
    embed_url: "", thumbnail_url: "", video_type: "match_replay", recorded_at: "", sort_order: 0,
    is_featured: false, is_published: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vRes, tRes] = await Promise.all([adminGetVideos(), adminGetTournaments()]);
      setVideos(vRes);
      setTournaments(tRes);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (video = null) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        tournament_id: video.tournament_id || "",
        title: video.title || "",
        description: video.description || "",
        source_type: video.source_type || "google_drive",
        source_url: video.source_url || "",
        embed_url: video.embed_url || "",
        thumbnail_url: video.thumbnail_url || "",
        video_type: video.video_type || "match_replay",
        recorded_at: video.recorded_at ? video.recorded_at.split('T')[0] : "",
        sort_order: video.sort_order || 0,
        is_featured: video.is_featured,
        is_published: video.is_published
      });
    } else {
      setEditingVideo(null);
      setFormData({
        tournament_id: "", title: "", description: "", source_type: "google_drive", source_url: "",
        embed_url: "", thumbnail_url: "", video_type: "match_replay", recorded_at: "", sort_order: 0,
        is_featured: false, is_published: true
      });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    
    // Auto-generate embed_url if empty and not custom
    if (!dataToSave.embed_url && dataToSave.source_type !== "custom_embed") {
      dataToSave.embed_url = buildEmbedUrl(dataToSave.source_type, dataToSave.source_url);
    }
    
    try {
      if (editingVideo) {
        await adminUpdateVideo(editingVideo.id, dataToSave);
        setToast({ message: "Video updated successfully", type: "success" });
      } else {
        await adminCreateVideo(dataToSave);
        setToast({ message: "Video added successfully", type: "success" });
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await adminDeleteVideo(id);
        setToast({ message: "Video deleted successfully", type: "success" });
        fetchData();
      } catch (err) {
        setToast({ message: err.message, type: "error" });
      }
    }
  };

  const previewEmbedUrl = formData.source_type === "custom_embed" 
    ? formData.embed_url || formData.source_url 
    : buildEmbedUrl(formData.source_type, formData.source_url);

  if (loading) return <LoadingState message="Loading video archive..." />;

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Video Archives</h1>
          <p className="admin-page-subtitle">Manage tournament video library.</p>
        </div>
        <button className="button-primary" onClick={() => handleOpenForm()}>Add Video</button>
      </div>

      {isFormOpen ? (
        <div className="admin-dashboard-grid" style={{ marginBottom: "24px" }}>
          <div className="admin-dashboard-main">
            <div className="admin-card">
              <div className="admin-card-title-row">
                <h2>{editingVideo ? "Edit Video" : "New Video"}</h2>
                <button className="button-secondary" onClick={() => setIsFormOpen(false)}>Cancel</button>
              </div>
              <form onSubmit={handleSave} style={{ display: "grid", gap: "16px" }}>
                <div className="form-group">
                  <label>Tournament</label>
                  <select value={formData.tournament_id} onChange={(e) => setFormData({ ...formData, tournament_id: e.target.value })}>
                    <option value="">-- No Tournament (Global) --</option>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Title</label>
                  <input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group">
                    <label>Source Type</label>
                    <select value={formData.source_type} onChange={(e) => setFormData({ ...formData, source_type: e.target.value })}>
                      <option value="google_drive">Google Drive</option>
                      <option value="facebook">Facebook</option>
                      <option value="youtube">YouTube</option>
                      <option value="custom_embed">Custom Embed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Video Type</label>
                    <select value={formData.video_type} onChange={(e) => setFormData({ ...formData, video_type: e.target.value })}>
                      <option value="live_replay">Live Replay</option>
                      <option value="match_replay">Match Replay</option>
                      <option value="highlights">Highlights</option>
                      <option value="opening">Opening</option>
                      <option value="finals">Finals</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Source URL</label>
                  <input required value={formData.source_url} onChange={(e) => setFormData({ ...formData, source_url: e.target.value })} />
                </div>
                {formData.source_type === "custom_embed" && (
                  <div className="form-group">
                    <label>Custom Embed URL / iframe SRC</label>
                    <input value={formData.embed_url} onChange={(e) => setFormData({ ...formData, embed_url: e.target.value })} />
                  </div>
                )}
                <div className="form-group">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2}></textarea>
                </div>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px", flex: 1 }}>
                    <input type="checkbox" id="is_published" checked={formData.is_published} onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })} style={{ width: "auto" }} />
                    <label htmlFor="is_published" style={{ marginBottom: 0, cursor: "pointer" }}>Published (Visible to public)</label>
                  </div>
                  <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: "8px", flex: 1 }}>
                    <input type="checkbox" id="is_featured" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} style={{ width: "auto" }} />
                    <label htmlFor="is_featured" style={{ marginBottom: 0, cursor: "pointer" }}>Featured</label>
                  </div>
                </div>
                <button type="submit" className="button-primary">Save Video</button>
              </form>
            </div>
          </div>
          <div className="admin-dashboard-side">
            <div className="admin-card">
              <h3 style={{ margin: "0 0 16px 0" }}>Preview</h3>
              {previewEmbedUrl ? (
                <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "8px", backgroundColor: "#000" }}>
                  <iframe src={previewEmbedUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
                </div>
              ) : (
                <div style={{ padding: "32px 16px", textAlign: "center", border: "1px dashed var(--jz-border)", borderRadius: "8px", color: "var(--jz-text-muted)" }}>
                  Enter a valid source URL to preview
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {!isFormOpen && videos.length === 0 ? (
        <EmptyState icon="🎬" title="No videos found" description="Add videos to the library to showcase them on the public portal." />
      ) : (
        <div className="admin-matches-list">
          {!isFormOpen && videos.map((v) => (
            <div key={v.id} className="admin-match-card">
              <div className="admin-match-header" style={{ justifyContent: "space-between" }}>
                <span className="admin-match-mode-pill">{v.video_type} • {v.source_type}</span>
                <span className={`status-badge is-${v.is_published ? 'completed' : 'pending'}`}>
                  {v.is_published ? 'PUBLISHED' : 'HIDDEN'}
                </span>
              </div>
              <div className="admin-match-body">
                <h3 style={{ margin: "0 0 8px 0" }}>{v.title}</h3>
                {v.tournament_name && <p className="admin-page-subtitle" style={{ margin: "0 0 8px 0" }}>{v.tournament_name}</p>}
                {v.is_featured && <p style={{ color: "var(--jz-accent-primary)", fontSize: "12px", marginTop: "8px", fontWeight: "bold" }}>★ Featured</p>}
              </div>
              <div className="admin-match-controls">
                <button className="button-secondary" onClick={() => handleOpenForm(v)}>Edit</button>
                <button className="button-danger" onClick={() => handleDelete(v.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}

export default ManageVideos;
