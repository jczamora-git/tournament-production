import { useState } from "react";
import { adminLogin } from "../../../services/api";

function AdminLogin({ onLogin }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Please enter the admin token");
      return;
    }

    setLoading(true);
    try {
      await adminLogin(token.trim());
      onLogin(token.trim());
    } catch (err) {
      setError(err.message || "Invalid admin token");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-panel">
        <div className="admin-login-brand">
          <div className="admin-login-brand-mark">J</div>
          <h1>Admin Login</h1>
          <p className="admin-login-desc">Jeizi Productions Tournament Admin</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          {error && <div className="admin-login-error">{error}</div>}
          <div className="form-group">
            <label>Admin Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter admin token"
              autoFocus
            />
          </div>
          <button type="submit" className="admin-login-submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
