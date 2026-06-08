import { useEffect, useState } from "react";
import { getScreeningsCapacity } from "../api";

function fmt12hr(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function occColor(pct) {
  if (pct >= 90) return "#e74c3c";
  if (pct >= 70) return "#e67e22";
  return "#258ccc";
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function CapacityMonitor() {
  const role = localStorage.getItem("loggedInRole");

  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState("");

  function load() {
    setLoading(true);
    getScreeningsCapacity()
      .then(d => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const filtered  = filter ? data.filter(s => s.title.toLowerCase().includes(filter.toLowerCase())) : data;
  const avgOcc    = data.length ? (data.reduce((s, r) => s + r.occupancy_pct, 0) / data.length).toFixed(1) : "—";
  const maxOcc    = data.length ? Math.max(...data.map(r => r.occupancy_pct)).toFixed(1) : "—";
  const totalSold = data.reduce((s, r) => s + Number(r.tickets_sold), 0);

  if (role !== "admin") return (
    <div className="access-denied">
      <div className="icon">🚫</div>
      <h2>Admin access only</h2>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Admin</p>
        <h1>Capacity Monitor</h1>
        <p>Live seat availability across all screenings.</p>
      </div>

      <div className="stat-grid">
        <StatCard label="Screenings"    value={data.length} />
        <StatCard label="Avg occupancy" value={`${avgOcc}%`} />
        <StatCard label="Peak"          value={`${maxOcc}%`} />
        <StatCard label="Tickets sold"  value={totalSold} />
      </div>

      <div className="filter-row">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filter by movie…" />
        <button className="btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {loading && <p className="loading-text">Loading…</p>}
      {error   && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>{["Movie","Theater","Date","Time","Sold","Available","Occupancy"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const pct = s.occupancy_pct;
                const col = occColor(pct);
                return (
                  <tr key={`${s.title}-${s.theater_id}-${s.screen_id}`}>
                    <td className="td-title">{s.title}</td>
                    <td>#{s.theater_id}</td>
                    <td className="td-nowrap">{fmtDate(s.screening_date)}</td>
                    <td>{fmt12hr(s.timeslot)}</td>
                    <td>{s.tickets_sold}</td>
                    <td style={{ fontWeight: 700, color: pct >= 90 ? "#e74c3c" : "#14334c" }}>{s.available_seats}</td>
                    <td>
                      <div className="occ-bar">
                        <div className="occ-bar-track">
                          <div className="occ-bar-fill" style={{ width: `${pct}%`, background: col }} />
                        </div>
                        <span className="occ-pct" style={{ color: col }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty-text">No screenings found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}