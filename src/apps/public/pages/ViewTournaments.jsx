import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTournaments } from "../../../services/api";
import LoadingState from "../../admin/components/LoadingState";
import EmptyState from "../../admin/components/EmptyState";

function ViewTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getTournaments()
      .then(setTournaments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading tournaments..." />;
  if (error) return <EmptyState icon="⚠️" title="Error loading tournaments" description={error} />;

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Tournaments</h1>
          <p className="admin-page-subtitle">Browse all official esports tournaments.</p>
        </div>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState icon="🏆" title="No tournaments available" description="Check back later for upcoming events." />
      ) : (
        <div className="admin-overview-grid">
          {tournaments.map((t) => (
            <Link key={t.id} to={`/videos?tournament=${t.id}`} className="admin-card" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <span className="admin-match-mode-pill">{t.game_type}</span>
                <span className={`status-badge is-${t.status === 'ongoing' ? 'live' : t.status === 'upcoming' ? 'pending' : 'completed'}`}>
                  {t.status.toUpperCase()}
                </span>
              </div>
              <h2 style={{ margin: "0 0 8px 0" }}>{t.name}</h2>
              {t.season && <p className="admin-page-subtitle" style={{ margin: "0 0 12px 0" }}>{t.season}</p>}
              {t.description && <p style={{ fontSize: "14px", color: "var(--jz-text-muted)", marginBottom: "16px", flex: 1 }}>{t.description}</p>}
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                <span style={{ color: "var(--jz-accent-primary)", fontSize: "14px", fontWeight: "bold" }}>View Videos &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewTournaments;
