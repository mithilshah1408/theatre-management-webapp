import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function NavLink({ to, children, onClick }) {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`nav-link ${active ? "nav-link--active" : ""}`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export default function Router() {
  const [open,    setOpen]    = useState(false);
  const name    = localStorage.getItem("loggedInName");
  const role    = localStorage.getItem("loggedInRole");
  const isAdmin = role === "admin";

  function close() { setOpen(false); }

  function handleLogout() {
    localStorage.removeItem("loggedInName");
    localStorage.removeItem("loggedInEmail");
    localStorage.removeItem("loggedInRole");
    window.location.href = "/";
  }

  const clientLinks = (
    <>
      <NavLink to="/movies"     onClick={close}>Movies</NavLink>
      <NavLink to="/screenings" onClick={close}>Screenings</NavLink>
      <NavLink to="/theaters"   onClick={close}>Theaters</NavLink>
      <NavLink to="/tickets"    onClick={close}>Tickets</NavLink>
      <NavLink to="/stars"      onClick={close}>Stars</NavLink>
      <NavLink to="/account"    onClick={close}>Account</NavLink>
    </>
  );

  const adminLinks = (
    <>
      <NavLink to="/admin"          onClick={close}>Dashboard</NavLink>
      <NavLink to="/admin/schedule" onClick={close}>Schedule</NavLink>
      <NavLink to="/admin/capacity" onClick={close}>Capacity</NavLink>
      <NavLink to="/admin/analytics"onClick={close}>Analytics</NavLink>
      <NavLink to="/movies"         onClick={close}>Movies</NavLink>
      <NavLink to="/theaters"       onClick={close}>Theaters</NavLink>
    </>
  );

  return (
    <nav>
      <h2>🎬 BlueMuse</h2>

      {/* desktop links */}
      <div className={`nav-links ${open ? "nav-links--open" : ""}`}>
        <NavLink to="/" onClick={close}>Home</NavLink>
        {isAdmin ? adminLinks : (name ? clientLinks : (
          <>
            <NavLink to="/movies"     onClick={close}>Movies</NavLink>
            <NavLink to="/screenings" onClick={close}>Screenings</NavLink>
            <NavLink to="/theaters"   onClick={close}>Theaters</NavLink>
          </>
        ))}

        {name ? (
          <>
            <span className={`nav-badge ${isAdmin ? "nav-badge--admin" : "nav-badge--client"}`}>
              {isAdmin ? "🔐" : "👤"} {name}
            </span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" onClick={close}>Sign in</NavLink>
        )}
      </div>

      {/* hamburger button (mobile only) */}
      <button
        className="nav-hamburger"
        aria-label="Toggle menu"
        onClick={() => setOpen(o => !o)}
      >
        {open ? "✕" : "☰"}
      </button>
    </nav>
  );
}