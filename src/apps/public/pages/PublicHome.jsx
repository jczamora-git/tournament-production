import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const MODAL_KEY = "jeizi_registration_modal_dismissed";

function RegistrationModal({ onClose }) {
  const navigate = useNavigate();

  return (
    <div className="ph-modal-backdrop" onClick={onClose}>
      <div className="ph-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ph-modal-icon">🏆</div>
        <h2>Are you registered on this tournament event?</h2>
        <p className="ph-modal-sub">
          Upload your team logo and submit your team details now.
        </p>
        <div className="ph-modal-actions">
          <button
            className="ph-btn ph-btn-primary"
            onClick={() => navigate("/upload-team")}
          >
            Upload Team Logo / Register Team
          </button>
          <button className="ph-modal-dismiss" onClick={onClose}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

function PublicHome() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const dismissed = sessionStorage.getItem(MODAL_KEY);
    if (!dismissed) {
      const timer = setTimeout(() => setShowModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismissModal = () => {
    setShowModal(false);
    sessionStorage.setItem(MODAL_KEY, "true");
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="ph-hero">
        <span className="ph-hero-eyebrow">Jeizi Productions Tournament</span>
        <h1>SK Barangay MLBB Season 2</h1>
        <p className="ph-hero-subtitle">
          Official tournament portal by Jeizi Productions
        </p>
        <p className="ph-hero-desc">
          Register your team, follow match schedules, watch live broadcasts, and
          view tournament highlights in one place.
        </p>
        <div className="ph-hero-actions">
          <Link to="/upload-team" className="ph-btn ph-btn-primary">
            Upload Team
          </Link>
          <Link to="/live" className="ph-btn ph-btn-blue">
            Watch Live
          </Link>
          <Link to="/matches" className="ph-btn ph-btn-secondary">
            View Matches
          </Link>
        </div>
      </section>

      {/* Featured Tournament */}
      <section className="ph-section">
        <div className="ph-section-header">
          <h2>Featured Tournament</h2>
          <p>The current active tournament event.</p>
        </div>
        <div className="ph-featured">
          <div className="ph-featured-top">
            <span className="ph-featured-game">MLBB</span>
            <span className="ph-featured-status">Registration Open</span>
          </div>
          <h3>SK Barangay MLBB Season 2</h3>
          <p className="ph-featured-desc">
            The official Mobile Legends: Bang Bang tournament for SK Barangay.
            Teams compete in bracket-style elimination to claim the championship
            title.
          </p>
          <div className="ph-featured-actions">
            <Link to="/tournaments" className="ph-btn ph-btn-secondary">
              View Tournament
            </Link>
            <Link to="/upload-team" className="ph-btn ph-btn-primary">
              Upload Team
            </Link>
          </div>
        </div>
      </section>

      {/* Action Tiles */}
      <section className="ph-section">
        <div className="ph-section-header">
          <h2>Tournament Hub</h2>
          <p>Everything you need in one place.</p>
        </div>
        <div className="ph-tiles">
          <Link to="/upload-team" className="ph-tile">
            <div className="ph-tile-icon">📋</div>
            <div className="ph-tile-content">
              <h3>Register Team</h3>
              <p>Submit your team details and logo for the tournament.</p>
            </div>
          </Link>
          <Link to="/live" className="ph-tile">
            <div className="ph-tile-icon is-green">📡</div>
            <div className="ph-tile-content">
              <h3>Watch Live</h3>
              <p>Watch the official tournament broadcast in real-time.</p>
            </div>
          </Link>
          <Link to="/tournaments" className="ph-tile">
            <div className="ph-tile-icon is-blue">🎮</div>
            <div className="ph-tile-content">
              <h3>Browse Tournaments</h3>
              <p>View all tournaments and event details.</p>
            </div>
          </Link>
          <Link to="/videos" className="ph-tile">
            <div className="ph-tile-icon is-orange">🎬</div>
            <div className="ph-tile-content">
              <h3>Video Archives</h3>
              <p>Replay past broadcasts and tournament highlights.</p>
            </div>
          </Link>
          <Link to="/matches" className="ph-tile">
            <div className="ph-tile-icon is-blue">⚔️</div>
            <div className="ph-tile-content">
              <h3>Match Schedule</h3>
              <p>Check current and upcoming match schedules.</p>
            </div>
          </Link>
          <Link to="/bracket" className="ph-tile">
            <div className="ph-tile-icon">🏆</div>
            <div className="ph-tile-content">
              <h3>Tournament Bracket</h3>
              <p>View elimination bracket and team standings.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Watch Section */}
      <section className="ph-section">
        <div className="ph-watch">
          <h2>Watch the Action</h2>
          <p>
            Follow live broadcasts and replay archives from recent tournaments.
          </p>
          <div className="ph-watch-actions">
            <Link to="/live" className="ph-btn ph-btn-blue">
              Watch Live
            </Link>
            <Link to="/videos" className="ph-btn ph-btn-secondary">
              View Videos
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="ph-footer-cta">
        <h2>Ready to join the tournament?</h2>
        <button
          className="ph-btn ph-btn-primary"
          onClick={() => navigate("/upload-team")}
        >
          Submit Your Team
        </button>
      </section>

      {/* Registration Modal */}
      {showModal && <RegistrationModal onClose={dismissModal} />}
    </div>
  );
}

export default PublicHome;
