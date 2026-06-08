import { useState } from "react";
import { loginUser, registerClient } from "../api";

const DEMO_ACCOUNTS = [
  {
    label:    "Admin",
    name:     "Mr. Boss",
    email:    "mrboss@smilingfriends.com",
    password: "boss123",
    icon:     "🔐",
    desc:     "Dashboard, analytics, scheduling",
    color:    "#14334c",
    bg:       "#e8f4fd",
    border:   "#add5ef",
  },
  {
    label:    "Client — Saja",
    name:     "Saja",
    email:    "saja2141@gmail.com",
    password: "saja123",
    icon:     "🎬",
    desc:     "Rewards at 8/10 · Dune waitlist #1",
    color:    "#1678b6",
    bg:       "#e2f4ff",
    border:   "#add5ef",
  },
  {
    label:    "Client — Jordy",
    name:     "Jordy",
    email:    "jpine25@uic.edu",
    password: "jordy123",
    icon:     "🎟️",
    desc:     "Ticket history · Dune waitlist #2",
    color:    "#1678b6",
    bg:       "#e2f4ff",
    border:   "#add5ef",
  },
];

export default function Login() {
  const [mode,      setMode]      = useState("login");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [demoLoading, setDemoLoading] = useState(null); // which demo is loading

  // login fields
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");

  // register fields
  const [name,      setName]      = useState("");
  const [address,   setAddress]   = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [interests, setInterests] = useState("");
  const [rewards,   setRewards]   = useState(false);

  function reset() {
    setError(""); setEmail(""); setPassword("");
    setName(""); setAddress(""); setConfirm(""); setInterests("");
  }

  function saveAndRedirect(data) {
    localStorage.setItem("loggedInName",  data.name);
    localStorage.setItem("loggedInEmail", data.email);
    localStorage.setItem("loggedInRole",  data.role);
    window.location.href = "/";
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    const data = await loginUser({ email, password });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    saveAndRedirect(data);
  }

  async function handleRegister(e) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setError(""); setLoading(true);
    const data = await registerClient({ email, password, name, address, interests, rewards });
    setLoading(false);
    if (data.error) { setError(data.error); return; }
    saveAndRedirect(data);
  }

  // One-click demo login
  async function handleDemo(account) {
    setError("");
    setDemoLoading(account.email);
    const data = await loginUser({ email: account.email, password: account.password });
    setDemoLoading(null);
    if (data.error) { setError(data.error); return; }
    saveAndRedirect(data);
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 460 }}>

        {/* logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🎬</span>
          <span className="auth-logo-text">BlueMuse</span>
        </div>

        <h1 className="auth-title">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in, or try a demo account below."
            : "Join BlueMuse and start booking."}
        </p>

        {/* ── Demo accounts ── */}
        {mode === "login" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
            <p style={{ margin: "0 0 6px", color: "#7da9c0", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1.5px" }}>
              Try a demo account
            </p>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                onClick={() => handleDemo(acc)}
                disabled={demoLoading !== null}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px",
                  background: demoLoading === acc.email ? "#d0e8f5" : acc.bg,
                  border: `1px solid ${acc.border}`,
                  borderRadius: "12px",
                  cursor: demoLoading !== null ? "not-allowed" : "pointer",
                  textAlign: "left", width: "100%",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  fontFamily: "inherit",
                  opacity: demoLoading !== null && demoLoading !== acc.email ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!demoLoading) e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
              >
                <span style={{ fontSize: "1.4rem", lineHeight: 1 }}>{acc.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", fontWeight: 800, fontSize: "13px", color: acc.color }}>
                    {demoLoading === acc.email ? "Signing in…" : acc.label}
                  </span>
                  <span style={{ display: "block", fontSize: "11px", color: "#7da9c0", marginTop: "1px" }}>
                    {acc.desc}
                  </span>
                </span>
                <span style={{ color: "#bddcf3", fontSize: "1rem" }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Divider ── */}
        {mode === "login" && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1, height: "1px", background: "#e2f4ff" }} />
            <span style={{ color: "#bddcf3", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>or sign in manually</span>
            <div style={{ flex: 1, height: "1px", background: "#e2f4ff" }} />
          </div>
        )}

        {error && <div className="auth-error">{error}</div>}

        {/* ── Form ── */}
        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="auth-form">

          {mode === "register" && (
            <>
              <div className="auth-field">
                <label>Full name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your name" required />
              </div>
              <div className="auth-field">
                <label>Address</label>
                <input value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Your address" required />
              </div>
            </>
          )}

          <div className="auth-field">
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
              required />
          </div>

          {mode === "register" && (
            <>
              <div className="auth-field">
                <label>Confirm password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter password" required />
              </div>
              <div className="auth-field">
                <label>Movie interests <span className="auth-optional">(optional)</span></label>
                <input value={interests} onChange={e => setInterests(e.target.value)}
                  placeholder="e.g. Sci-fi, Ghibli, horror…" />
              </div>
              <label className="auth-checkbox">
                <input type="checkbox" checked={rewards} onChange={e => setRewards(e.target.checked)} />
                Join BlueMuse Rewards — earn a free ticket every 10 movies
              </label>
            </>
          )}

          <button type="submit" className="auth-submit" disabled={loading || demoLoading !== null}>
            {loading ? "Just a moment…" : mode === "login" ? "Sign in" : "Create account"}
          </button>

        </form>

        <p className="auth-switch">
          {mode === "login" ? (
            <>New here? <button className="auth-link" onClick={() => { reset(); setMode("register"); }}>Create an account</button></>
          ) : (
            <>Already have an account? <button className="auth-link" onClick={() => { reset(); setMode("login"); }}>Sign in</button></>
          )}
        </p>

      </div>
    </div>
  );
}