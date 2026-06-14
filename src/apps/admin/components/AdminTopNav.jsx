import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/teams", label: "Teams" },
  { to: "/team-submissions", label: "Submissions" },
  { to: "/matches", label: "Matches" },
  { to: "/history", label: "History" },
  { to: "/bracket", label: "Bracket" },
];

function AdminTopNav({ onLogout }) {
  return (
    <header className="admin-topnav">
      <div className="admin-topnav-inner">
        <NavLink to="/dashboard" className="admin-brand">
          <span className="admin-brand-mark">J</span>
          <span>Jeizi Admin</span>
        </NavLink>

        <nav className="admin-nav-links" aria-label="Admin navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link${isActive ? " is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="admin-nav-logout"
          onClick={onLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default AdminTopNav;
