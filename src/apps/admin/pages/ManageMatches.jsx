import { useState, useEffect, useCallback } from "react";
import {
  adminGetMatches,
  adminGetTeams,
  adminCreateMatch,
  adminUpdateMatch,
  adminDeleteMatch,
} from "../../../services/api";
import Toast from "../components/Toast";
import ConfirmationModal from "../components/ConfirmationModal";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";

function ManageMatches() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [blueTeamId, setBlueTeamId] = useState("");
  const [redTeamId, setRedTeamId] = useState("");
  const [mode, setMode] = useState("BO3");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("queued");
  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [m, t] = await Promise.all([adminGetMatches(), adminGetTeams()]);
      setMatches(m);
      setTeams(t);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setBlueTeamId("");
    setRedTeamId("");
    setMode("BO3");
    setTitle("");
    setStatus("queued");
    setBlueScore(0);
    setRedScore(0);
    setEditingId(null);
    setFormError("");
    setModalOpen(false);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (match) => {
    setEditingId(match.id);
    setBlueTeamId(match.blue_team_id || "");
    setRedTeamId(match.red_team_id || "");
    setMode(match.mode || "BO3");
    setTitle(match.title || "");
    setStatus(match.status || "queued");
    setBlueScore(match.blue_score || 0);
    setRedScore(match.red_score || 0);
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!blueTeamId || !redTeamId) {
      setFormError("Both teams are required");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await adminUpdateMatch(editingId, {
          blue_team_id: Number(blueTeamId),
          red_team_id: Number(redTeamId),
          mode,
          title: title || "Match",
          status,
          blue_score: Number(blueScore),
          red_score: Number(redScore),
        });
        setToast({ message: "Match updated successfully", type: "success" });
      } else {
        await adminCreateMatch({
          blue_team_id: Number(blueTeamId),
          red_team_id: Number(redTeamId),
          mode,
          title: title || "Match",
          status,
        });
        setToast({ message: "Match created successfully", type: "success" });
      }
      resetForm();
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminDeleteMatch(deleteTarget.id);
      setToast({ message: "Match deleted", type: "success" });
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
      setDeleteTarget(null);
    }
  };

  const teamName = (id) => {
    const t = teams.find((team) => team.id === id);
    return t ? t.shortname || t.name : `Team ${id}`;
  };

  if (loading) return <LoadingState message="Loading matches..." />;

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Manage Matches</h1>
          <p className="admin-page-subtitle">Create, edit, and manage tournament matches.</p>
        </div>
        <button type="button" className="button-primary" onClick={openCreate}>
          + Create Match
        </button>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon="⚔️"
          title="No matches yet"
          description="Create your first match to get started."
        >
          <button type="button" className="button-primary" onClick={openCreate} style={{ marginTop: "8px" }}>
            + Create Match
          </button>
        </EmptyState>
      ) : (
        <div className="admin-match-list">
          {matches.map((match) => (
            <div key={match.id} className="admin-match-card">
              <div className="admin-match-card-header">
                <span className="admin-match-card-title">{match.title || "Untitled Match"}</span>
                <span className={`status-badge status-${match.status}`}>{match.status}</span>
              </div>

              <div className="admin-match-card-teams">
                <div className="admin-match-team">
                  <div className="admin-match-team-fallback">
                    {teamName(match.blue_team_id)?.[0] || "B"}
                  </div>
                  <span className="admin-match-team-name">{teamName(match.blue_team_id)}</span>
                </div>

                <div className="admin-match-score-center">
                  {match.blue_score} - {match.red_score}
                </div>

                <div className="admin-match-team is-red">
                  <div className="admin-match-team-fallback">
                    {teamName(match.red_team_id)?.[0] || "R"}
                  </div>
                  <span className="admin-match-team-name">{teamName(match.red_team_id)}</span>
                </div>
              </div>

              <div className="admin-match-card-footer">
                <div className="admin-match-card-meta">
                  <span className="admin-match-mode-pill">{match.mode}</span>
                </div>
                <div className="admin-match-card-actions">
                  <button type="button" className="button-ghost button-compact" onClick={() => openEdit(match)}>
                    Edit
                  </button>
                  <button type="button" className="button-danger-outline button-compact" onClick={() => setDeleteTarget(match)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <div className="admin-modal-panel">
            <div className="admin-modal-header">
              <h2>{editingId ? "Edit Match" : "Create Match"}</h2>
              <button type="button" className="admin-modal-close" onClick={resetForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                {formError && <div className="admin-error-message">{formError}</div>}

                <div className="admin-form-row">
                  <div className="form-group">
                    <label>Blue Team *</label>
                    <select value={blueTeamId} onChange={(e) => setBlueTeamId(e.target.value)}>
                      <option value="">Select team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Red Team *</label>
                    <select value={redTeamId} onChange={(e) => setRedTeamId(e.target.value)}>
                      <option value="">Select team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="form-group">
                    <label>Mode</label>
                    <select value={mode} onChange={(e) => setMode(e.target.value)}>
                      <option value="BO1">BO1</option>
                      <option value="BO3">BO3</option>
                      <option value="BO5">BO5</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="queued">Queued</option>
                      <option value="upcoming">Upcoming</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="live">Live</option>
                      <option value="finished">Finished</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Upper Bracket R1"
                  />
                </div>

                {editingId && (
                  <div className="admin-form-row">
                    <div className="form-group">
                      <label>Blue Score</label>
                      <input type="number" value={blueScore} onChange={(e) => setBlueScore(e.target.value)} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Red Score</label>
                      <input type="number" value={redScore} onChange={(e) => setRedScore(e.target.value)} min="0" />
                    </div>
                  </div>
                )}
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="button-ghost" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Match" : "Create Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={!!deleteTarget}
        title="Delete Match"
        message={`Are you sure you want to delete "${deleteTarget?.title || "this match"}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "info" })} />
    </div>
  );
}

export default ManageMatches;
