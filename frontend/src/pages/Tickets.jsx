import { useEffect, useState } from "react";
import { getTickets } from "../api";

function fmt12hr(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

export default function Tickets() {
  const email = localStorage.getItem("loggedInEmail");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    getTickets(email)
      .then(d => { if (d.error) throw new Error(d.error); setTickets(Array.isArray(d) ? d : []); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [email]);

  if (!email) return (
    <div className="access-denied">
      <div className="icon">🎟️</div>
      <h2>Not signed in</h2>
      <p>Please <a href="/login" style={{ color: "#258ccc" }}>sign in</a> to view your tickets.</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">My Account</p>
        <h1>My Tickets</h1>
        <p>All your booked screenings in one place.</p>
      </div>

      {loading && <p className="loading-text">Loading tickets…</p>}
      {error   && <div className="alert-error">{error}</div>}
      {!loading && !error && tickets.length === 0 && (
        <p className="empty-text">You haven't booked any tickets yet.</p>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {tickets.map(t => (
            <div key={t.order_id} className="panel" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "8px 20px", alignItems: "start" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "4px" }}>Order #{t.order_id}</p>
                <h2 style={{ color: "#14334c", fontWeight: 800, margin: "0 0 10px", fontSize: "1.1rem" }}>{t.title}</h2>
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", color: "#3e6784", fontSize: "0.85rem" }}>
                  <span>🎭 Theater #{t.theater_id}</span>
                  {t.screening_date && <span>📅 {t.screening_date}</span>}
                  {t.timeslot       && <span>🕐 {fmt12hr(t.timeslot)}</span>}
                  <span>🎟️ {t.num_sold} ticket{t.num_sold !== 1 ? "s" : ""}</span>
                </div>
                <p style={{ color: "#7da9c0", fontSize: "0.75rem", marginTop: "8px" }}>
                  Purchased: {new Date(t.sale_timestamp).toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ color: "#258ccc", fontWeight: 800, fontSize: "1.3rem" }}>
                  ${t.total_price?.toFixed(2) ?? "—"}
                </div>
                <div style={{ color: "#7da9c0", fontSize: "0.72rem" }}>
                  ${t.price_per_ticket?.toFixed(2) ?? "—"} / ticket
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}