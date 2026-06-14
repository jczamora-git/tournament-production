import { useState, useEffect } from "react";
import { getUpcomingMatches } from "../../../services/api";
import EmptyState from "../../admin/components/EmptyState";
import LoadingState from "../../admin/components/LoadingState";

function ViewMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getUpcomingMatches()
      .then(setMatches)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading matches..." />;
  if (error) {
    return (
      <div>
        <h1>Matches</h1>
        <div className="admin-error-message">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h1>Matches</h1>
          <p className="admin-page-subtitle">Current and upcoming tournament matches.</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon="⚔️"
          title="No upcoming matches"
          description="Check back later for scheduled matches."
        />
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
                    {(match.blue_team?.shortname || match.blue_team?.name || `Team ${match.blue_team_id}`)?.[0]}
                  </div>
                  <span className="admin-match-team-name">
                    {match.blue_team?.shortname || match.blue_team?.name || `Team ${match.blue_team_id}`}
                  </span>
                </div>

                <div className="admin-match-score-center">
                  {match.blue_score} - {match.red_score}
                </div>

                <div className="admin-match-team is-red">
                  <div className="admin-match-team-fallback">
                    {(match.red_team?.shortname || match.red_team?.name || `Team ${match.red_team_id}`)?.[0]}
                  </div>
                  <span className="admin-match-team-name">
                    {match.red_team?.shortname || match.red_team?.name || `Team ${match.red_team_id}`}
                  </span>
                </div>
              </div>

              <div className="admin-match-card-footer">
                <div className="admin-match-card-meta">
                  <span className="admin-match-mode-pill">{match.mode}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ViewMatches;
