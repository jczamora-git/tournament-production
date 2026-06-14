import { useState, useEffect, useCallback } from "react";
import { adminGetTeams, adminCreateTeam, adminUpdateTeam, adminDeleteTeam } from "../../../services/api";
import Toast from "../components/Toast";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";

function ManageTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [shortname, setShortname] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTeams = useCallback(async () => {
    try {
      const data = await adminGetTeams();
      setTeams(data);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const resetForm = () => {
    setName("");
    setShortname("");
    setLogoUrl("");
    setEditingId(null);
    setFormError("");
    setModalOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (team) => {
    setEditingId(team.id);
    setName(team.name);
    setShortname(team.shortname || "");
    setLogoUrl(team.logo || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Team name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await adminUpdateTeam(editingId, {
          name: name.trim(),
          shortname: shortname.trim() || null,
          logo: logoUrl.trim() || null,
        });
        setToast({ message: "Team updated successfully", type: "success" });
      } else {
        await adminCreateTeam({
          name: name.trim(),
          shortname: shortname.trim() || null,
          logo: logoUrl.trim() || null,
        });
        setToast({ message: "Team created successfully", type: "success" });
      }
      resetForm();
      fetchTeams();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteTeam(deleteTarget.id);
      setToast({ message: `"${deleteTarget.name}" deleted`, type: "success" });
      setDeleteTarget(null);
      fetchTeams();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
      setDeleteTarget(null);
    }
  };

  if (loading) return <LoadingState message="Loading teams..." />;

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Manage Teams</h1>
          <p className="admin-page-subtitle">Add, edit, and manage tournament teams.</p>
        </div>
        <button type="button" className="button-primary" onClick={openAdd}>
          + Add Team
        </button>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No teams yet"
          description="Create your first team to get started."
        >
          <button type="button" className="button-primary" onClick={openAdd} style={{ marginTop: "8px" }}>
            + Add Team
          </button>
        </EmptyState>
      ) : (
        <div className="admin-team-grid">
          {teams.map((team) => (
            <div key={team.id} className="admin-team-card">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="admin-team-logo" />
              ) : (
                <div className="admin-team-logo-fallback">
                  {(team.shortname || team.name)?.[0] || "?"}
                </div>
              )}
              <div className="admin-team-info">
                <span className="admin-team-name">{team.name}</span>
                {team.shortname && (
                  <span className="admin-team-shortname">{team.shortname}</span>
                )}
              </div>
              <div className="admin-team-actions">
                <button type="button" className="button-ghost button-compact" onClick={() => openEdit(team)}>
                  Edit
                </button>
                <button type="button" className="button-danger-outline button-compact" onClick={() => setDeleteTarget(team)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-panel">
            <div className="admin-modal-header">
              <h2>{editingId ? "Edit Team" : "Add Team"}</h2>
              <button type="button" className="admin-modal-close" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {formError && <div className="admin-error-message">{formError}</div>}
                <div className="form-group">
                  <label>Team Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Team Liquid"
                    autoFocus
                  />
                </div>
                <div className="admin-form-row">
                  <div className="form-group">
                    <label>Short Name</label>
                    <input
                      type="text"
                      value={shortname}
                      onChange={(e) => setShortname(e.target.value)}
                      placeholder="e.g. TL"
                    />
                  </div>
                  <div className="form-group">
                    <label>Logo URL</label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="button-ghost" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Team" : "Add Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        open={!!deleteTarget}
        title="Delete Team"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}

export default ManageTeams;
