import { useState, useEffect, useRef } from "react";
import { adminGetTournaments, adminCreateTournament, adminUpdateTournament, adminDeleteTournament, adminUploadTournamentImage } from "../../../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Toast from "../components/Toast";

const GAME_MODE_DEFAULTS = {
  MLBB: [
    { code: "MOBA", name: "MOBA", competition_type: "head_to_head" },
    { code: "MAGIC_CHESS", name: "Magic Chess", competition_type: "free_for_all" },
  ],
  HOK: [
    { code: "MOBA", name: "MOBA", competition_type: "head_to_head" },
  ],
  CODM: [
    { code: "MP", name: "Multiplayer", competition_type: "head_to_head" },
    { code: "BR", name: "Battle Royale", competition_type: "battle_royale" },
  ],
};

const COMPETITION_TYPES = [
  { value: "head_to_head", label: "Head to Head" },
  { value: "battle_royale", label: "Battle Royale" },
  { value: "free_for_all", label: "Free for All" },
];

function ImageUploadCard({ title, helper, url, onUrlChange, type, tournamentId, previewVariant }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileSelect = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError("");
    setSuccess(false);
    setUploading(true);
    try {
      const result = await adminUploadTournamentImage(file, type, tournamentId);
      onUrlChange(result.url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleClear = () => {
    onUrlChange("");
    setError("");
    setSuccess(false);
  };

  const isCover = previewVariant === "cover";

  return (
    <div className={`admin-upload-card ${isCover ? "admin-upload-card-cover" : "admin-upload-card-logo"}`}>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleFileChange}
      />

      <div className="admin-upload-card-header">
        <div className="admin-upload-card-icon">
          {isCover ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          )}
        </div>
        <div className="admin-upload-card-title-group">
          <span className="admin-upload-card-title">{title}</span>
          <span className="admin-upload-helper-text">{helper}</span>
        </div>
      </div>

      {url && (
        <div className={`admin-upload-preview ${isCover ? "admin-upload-preview-cover" : "admin-upload-preview-logo"}`}>
          <img src={url} alt={title} />
        </div>
      )}

      {!url && !uploading && (
        <div className={`admin-upload-dropzone ${isCover ? "admin-upload-dropzone-cover" : "admin-upload-dropzone-logo"}`} onClick={handleFileSelect}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Click to upload or drag file here</span>
          <span className="admin-upload-formats">PNG, JPG, WebP</span>
        </div>
      )}

      {uploading && (
        <div className="admin-upload-status admin-upload-status-loading">
          <div className="admin-upload-spinner" />
          <span>Uploading...</span>
        </div>
      )}

      {error && (
        <div className="admin-upload-status admin-upload-status-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && !error && (
        <div className="admin-upload-status admin-upload-status-success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>Upload successful</span>
        </div>
      )}

      <div className="admin-upload-actions">
        <button type="button" className="button-secondary button-compact" onClick={handleFileSelect} disabled={uploading}>
          {url ? (isCover ? "Change Cover" : "Change Logo") : (isCover ? "Choose Cover" : "Choose Logo")}
        </button>
        {url && (
          <button type="button" className="button-ghost button-compact" onClick={handleClear} disabled={uploading}>
            Remove
          </button>
        )}
        <button type="button" className="button-ghost button-compact" onClick={() => setShowUrlInput(!showUrlInput)} style={{ marginLeft: "auto" }}>
          {showUrlInput ? "Hide URL" : "Paste URL"}
        </button>
      </div>

      {showUrlInput && (
        <div className="admin-upload-url-input">
          <label className="admin-upload-url-label">Or paste image URL</label>
          <input
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="https://example.com/image.png"
          />
        </div>
      )}
    </div>
  );
}

function getDefaultModesForGame(game_type) {
  const defs = GAME_MODE_DEFAULTS[game_type];
  if (!defs) return [];
  // For HOK, auto-select the single mode
  if (game_type === "HOK") {
    return defs.map((d) => ({ ...d, selected: true, team_upload_enabled: true, is_active: true }));
  }
  return defs.map((d) => ({ ...d, selected: false, team_upload_enabled: true, is_active: true }));
}

function ManageTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: "", slug: "", game_type: "MLBB", season: "", description: "",
    status: "upcoming", banner_url: "", logo_url: "", cover_image_url: "", logo_image_url: "",
    start_date: "", end_date: "", is_active: true
  });
  const [formModes, setFormModes] = useState(getDefaultModesForGame("MLBB"));
  const [customModes, setCustomModes] = useState([]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const data = await adminGetTournaments();
      setTournaments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments().catch(err => setToast({ message: err.message, type: "error" }));
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
        cover_image_url: tournament.cover_image_url || "",
        logo_image_url: tournament.logo_image_url || "",
        start_date: tournament.start_date ? tournament.start_date.split('T')[0] : "",
        end_date: tournament.end_date ? tournament.end_date.split('T')[0] : "",
        is_active: tournament.is_active
      });

      // Load existing modes
      const gt = tournament.game_type || "MLBB";
      if (gt === "OTHER") {
        setFormModes([]);
        setCustomModes((tournament.modes || []).map((m) => ({
          code: m.code,
          name: m.name,
          competition_type: m.competition_type,
          team_upload_enabled: m.team_upload_enabled !== false,
          is_active: m.is_active !== false,
          sort_order: m.sort_order ?? 0,
        })));
      } else {
        const defs = GAME_MODE_DEFAULTS[gt] || [];
        const existingModes = tournament.modes || [];
        const mapped = defs.map((d, i) => {
          const em = existingModes.find((m) => m.code === d.code);
          return {
            ...d,
            selected: !!em,
            team_upload_enabled: em ? em.team_upload_enabled !== false : true,
            is_active: em ? em.is_active !== false : true,
            sort_order: em ? em.sort_order : i,
          };
        });
        setFormModes(mapped);
        setCustomModes([]);
      }
    } else {
      setEditingTournament(null);
      setFormData({
        name: "", slug: "", game_type: "MLBB", season: "", description: "",
        status: "upcoming", banner_url: "", logo_url: "", cover_image_url: "", logo_image_url: "",
        start_date: "", end_date: "", is_active: true
      });
      setFormModes(getDefaultModesForGame("MLBB"));
      setCustomModes([]);
    }
    setIsFormOpen(true);
  };

  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  const handleCoverChange = (url) => {
    setFormData({ ...formData, cover_image_url: url, banner_url: url });
  };

  const handleLogoChange = (url) => {
    setFormData({ ...formData, logo_image_url: url, logo_url: url });
  };

  const handleGameTypeChange = (newType) => {
    setFormData({ ...formData, game_type: newType });
    if (newType === "OTHER") {
      setFormModes([]);
      if (customModes.length === 0) {
        setCustomModes([{ code: "", name: "", competition_type: "head_to_head", team_upload_enabled: true, is_active: true }]);
      }
    } else {
      setFormModes(getDefaultModesForGame(newType));
      setCustomModes([]);
    }
  };

  const toggleMode = (code) => {
    setFormModes((prev) => prev.map((m) => m.code === code ? { ...m, selected: !m.selected } : m));
  };

  const toggleModeUpload = (code) => {
    setFormModes((prev) => prev.map((m) => m.code === code ? { ...m, team_upload_enabled: !m.team_upload_enabled } : m));
  };

  const addCustomMode = () => {
    setCustomModes([...customModes, { code: "", name: "", competition_type: "head_to_head", team_upload_enabled: true, is_active: true }]);
  };

  const removeCustomMode = (index) => {
    setCustomModes(customModes.filter((_, i) => i !== index));
  };

  const updateCustomMode = (index, field, value) => {
    setCustomModes(customModes.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const getSelectedModes = () => {
    if (formData.game_type === "OTHER") {
      return customModes
        .filter((m) => m.code.trim() && m.name.trim())
        .map((m, i) => ({
          code: m.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, ""),
          name: m.name.trim(),
          competition_type: m.competition_type || "head_to_head",
          team_upload_enabled: m.team_upload_enabled !== false,
          is_active: m.is_active !== false,
          sort_order: i,
        }));
    }
    return formModes
      .filter((m) => m.selected)
      .map((m, i) => ({
        code: m.code,
        name: m.name,
        competition_type: m.competition_type,
        team_upload_enabled: m.team_upload_enabled !== false,
        is_active: m.is_active !== false,
        sort_order: m.sort_order ?? i,
      }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const dataToSave = { ...formData };
    if (!dataToSave.slug && dataToSave.name) {
      dataToSave.slug = generateSlug(dataToSave.name);
    }

    const selectedModes = getSelectedModes();
    if (selectedModes.length === 0) {
      setToast({ message: "At least one mode is required.", type: "error" });
      return;
    }

    if (dataToSave.start_date && dataToSave.end_date && new Date(dataToSave.end_date) < new Date(dataToSave.start_date)) {
      setToast({ message: "End date must not be earlier than start date.", type: "error" });
      return;
    }

    dataToSave.modes = selectedModes;

    setSaving(true);
    let success = false;
    try {
      if (editingTournament) {
        const result = await adminUpdateTournament(editingTournament.id, dataToSave);
        let msg = "Tournament updated successfully";
        if (result?.warnings && result.warnings.length > 0) {
          msg += ". " + result.warnings.join(" ");
        }
        setToast({ message: msg, type: result?.warnings?.length ? "warning" : "success" });
      } else {
        const result = await adminCreateTournament(dataToSave);
        setToast({ message: result?.message || "Tournament created successfully", type: "success" });
      }
      setIsFormOpen(false);
      success = true;
    } catch (createError) {
      console.error("Tournament save failed:", createError);
      setToast({ message: createError.message || "Failed to save tournament.", type: "error" });
    } finally {
      setSaving(false);
    }

    if (success) {
      try {
        await fetchTournaments();
      } catch (refreshError) {
        console.error("Tournament saved, but refreshing the list failed:", refreshError);
        setToast({ message: "Tournament saved, but the list could not be refreshed. Please refresh the page.", type: "warning" });
      }
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

  const renderModeSection = () => {
    const gt = formData.game_type;

    if (gt === "OTHER") {
      return (
        <div className="tournament-form-section">
          <div className="tournament-form-section-title">
            <span className="tournament-form-section-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </span>
            <span>Custom Modes</span>
          </div>
          <p style={{ color: "var(--jz-text-soft)", fontSize: "13px", marginBottom: "12px" }}>
            Define at least one competition mode for this tournament.
          </p>
          {customModes.map((cm, i) => (
            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-end", marginBottom: "8px", flexWrap: "wrap" }}>
              <div className="form-group" style={{ flex: 1, minWidth: "120px", marginBottom: 0 }}>
                {i === 0 && <label style={{ fontSize: "12px" }}>Code</label>}
                <input
                  value={cm.code}
                  onChange={(e) => updateCustomMode(i, "code", e.target.value)}
                  placeholder="e.g. VOLLEYBALL"
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: "120px", marginBottom: 0 }}>
                {i === 0 && <label style={{ fontSize: "12px" }}>Name</label>}
                <input
                  value={cm.name}
                  onChange={(e) => updateCustomMode(i, "name", e.target.value)}
                  placeholder="e.g. Volleyball"
                />
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: "140px", marginBottom: 0 }}>
                {i === 0 && <label style={{ fontSize: "12px" }}>Competition Type</label>}
                <select value={cm.competition_type} onChange={(e) => updateCustomMode(i, "competition_type", e.target.value)}>
                  {COMPETITION_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", paddingBottom: "2px" }}>
                <input type="checkbox" checked={cm.team_upload_enabled} onChange={() => updateCustomMode(i, "team_upload_enabled", !cm.team_upload_enabled)} id={`cm-upload-${i}`} />
                <label htmlFor={`cm-upload-${i}`} style={{ fontSize: "11px", color: "var(--jz-text-soft)", whiteSpace: "nowrap" }}>Upload</label>
              </div>
              {customModes.length > 1 && (
                <button type="button" className="button-ghost button-compact" onClick={() => removeCustomMode(i)} style={{ color: "#f87171", padding: "6px" }}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className="button-secondary button-compact" onClick={addCustomMode} style={{ marginTop: "4px" }}>
            + Add Mode
          </button>
        </div>
      );
    }

    const defs = GAME_MODE_DEFAULTS[gt];
    if (!defs) return null;

    const isHOK = gt === "HOK";

    return (
      <div className="tournament-form-section">
        <div className="tournament-form-section-title">
          <span className="tournament-form-section-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </span>
          <span>Competition Modes</span>
        </div>
        <p style={{ color: "var(--jz-text-soft)", fontSize: "13px", marginBottom: "12px" }}>
          {isHOK ? "HOK tournaments use MOBA mode." : `Select which modes to enable for this ${gt} tournament. At least one is required.`}
        </p>
        {formModes.map((m) => (
          <div key={m.code} className="tournament-toggle-row" style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <input
              type="checkbox"
              checked={isHOK ? true : m.selected}
              disabled={isHOK}
              onChange={() => toggleMode(m.code)}
              id={`mode-${m.code}`}
            />
            <label htmlFor={`mode-${m.code}`} className="tournament-toggle-label" style={{ flex: 1 }}>
              <span className="tournament-toggle-title">{m.name}</span>
              <span className="tournament-toggle-desc">{m.competition_type.replace(/_/g, " ")}</span>
            </label>
            {(isHOK || m.selected) && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="checkbox"
                  checked={m.team_upload_enabled}
                  onChange={() => toggleModeUpload(m.code)}
                  id={`mode-upload-${m.code}`}
                />
                <label htmlFor={`mode-upload-${m.code}`} style={{ fontSize: "12px", color: "var(--jz-text-soft)", whiteSpace: "nowrap" }}>
                  Team Upload
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

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
        <div className="admin-card tournament-form" style={{ marginBottom: "24px" }}>
          <div className="tournament-form-header">
            <div>
              <h2>{editingTournament ? "Edit Tournament" : "New Tournament"}</h2>
              <p className="admin-page-subtitle" style={{ marginTop: "4px" }}>
                {editingTournament
                  ? "Update tournament details and branding assets."
                  : "Create a tournament event with branding, schedule, and game type."}
              </p>
            </div>
            <button className="button-secondary button-compact" onClick={() => setIsFormOpen(false)}>Cancel</button>
          </div>

          <form onSubmit={handleSave} className="tournament-form-body">
            {/* Section: Basic Information */}
            <div className="tournament-form-section">
              <div className="tournament-form-section-title">
                <span className="tournament-form-section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                </span>
                <span>Basic Information</span>
              </div>

              <div className="tournament-form-grid">
                <div className="form-group tournament-form-full">
                  <label>Tournament Name</label>
                  <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. SK Barangay MLBB Season 2" />
                </div>
                <div className="form-group tournament-form-full">
                  <label>Slug (Auto-generated if empty)</label>
                  <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g. sk-mlbb-s2" />
                </div>
                <div className="form-group">
                  <label>Game Type</label>
                  <select value={formData.game_type} onChange={(e) => handleGameTypeChange(e.target.value)}>
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
                <div className="form-group">
                  <label>Season</label>
                  <input value={formData.season} onChange={(e) => setFormData({ ...formData, season: e.target.value })} placeholder="e.g. Season 2" />
                </div>
                <div className="form-group tournament-form-full">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} placeholder="Brief description of the tournament..."></textarea>
                </div>
              </div>
            </div>

            {/* Section: Competition Modes */}
            {renderModeSection()}

            {/* Section: Schedule */}
            <div className="tournament-form-section">
              <div className="tournament-form-section-title">
                <span className="tournament-form-section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <span>Schedule</span>
              </div>

              <div className="tournament-form-grid">
                <div className="form-group">
                  <label>Start Date</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />
                </div>
                <div className="form-group tournament-form-full">
                  <div className="tournament-toggle-row">
                    <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                    <label htmlFor="is_active" className="tournament-toggle-label">
                      <span className="tournament-toggle-title">Active Tournament</span>
                      <span className="tournament-toggle-desc">Visible to the public when enabled</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Branding */}
            <div className="tournament-form-section">
              <div className="tournament-form-section-title">
                <span className="tournament-form-section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </span>
                <span>Tournament Branding</span>
              </div>

              <div className="tournament-branding-grid">
                <ImageUploadCard
                  title="Tournament Cover Image"
                  helper="Recommended for hero/banner background."
                  url={formData.cover_image_url || formData.banner_url}
                  onUrlChange={handleCoverChange}
                  type="cover"
                  tournamentId={editingTournament?.id}
                  previewVariant="cover"
                />
                <ImageUploadCard
                  title="Tournament Logo Image"
                  helper="Recommended transparent PNG or square logo."
                  url={formData.logo_image_url || formData.logo_url}
                  onUrlChange={handleLogoChange}
                  type="logo"
                  tournamentId={editingTournament?.id}
                  previewVariant="logo"
                />
              </div>
            </div>

            {/* Section: Actions */}
            <div className="tournament-form-actions">
              <button type="submit" className="button-primary tournament-form-save" disabled={saving || uploading}>
                {saving ? "Saving Tournament..." : "Save Tournament"}
              </button>
              <button type="button" className="button-secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {!isFormOpen && tournaments.length === 0 ? (
        <EmptyState icon="🏆" title="No tournaments found" description="Create a tournament to get started." />
      ) : (
        <div className="admin-matches-list">
          {!isFormOpen && tournaments.map((t) => (
            <div key={t.id} className="admin-match-card tournament-list-card">
              <div className="tournament-list-card-top">
                {(t.cover_image_url || t.banner_url) ? (
                  <div className="tournament-list-cover">
                    <img src={t.cover_image_url || t.banner_url} alt={t.name} />
                  </div>
                ) : (
                  <div className="tournament-list-cover tournament-list-cover-empty">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </div>
                )}
                <div className="tournament-list-badges">
                  <span className="admin-match-mode-pill">{t.game_type}</span>
                  <span className={`status-badge status-${t.status === 'ongoing' ? 'live' : t.status === 'upcoming' ? 'upcoming' : 'finished'}`}>
                    {t.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="tournament-list-body">
                <div className="tournament-list-info">
                  {(t.logo_image_url || t.logo_url) ? (
                    <img className="tournament-list-logo" src={t.logo_image_url || t.logo_url} alt="" />
                  ) : (
                    <div className="tournament-list-logo-fallback">
                      {t.name?.charAt(0)?.toUpperCase() || "T"}
                    </div>
                  )}
                  <div className="tournament-list-meta">
                    <h3>{t.name}</h3>
                    {t.season && <span className="tournament-list-season">{t.season}</span>}
                    <span className="tournament-list-slug">{t.slug}</span>
                    {t.modes && t.modes.length > 0 && (
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                        {t.modes.map((m) => (
                          <span key={m.id} className="admin-match-mode-pill" style={{ fontSize: "10px", padding: "2px 6px", opacity: m.is_active ? 1 : 0.5 }}>
                            {m.name}{!m.is_active ? " (inactive)" : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {!t.is_active && <span className="tournament-list-inactive">Inactive</span>}
              </div>
              <div className="admin-match-controls">
                <button className="button-secondary button-compact" onClick={() => handleOpenForm(t)}>Edit</button>
                <button className="button-danger button-compact" onClick={() => handleDelete(t.id)}>Delete</button>
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
