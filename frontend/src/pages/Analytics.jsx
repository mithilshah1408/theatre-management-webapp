import { useEffect, useState } from "react";
import { getRevenueReport, getOccupancyReport, getOccupancySummary } from "../api";

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function Analytics() {
  const role = localStorage.getItem("loggedInRole");

  const [revenue,   setRevenue]   = useState(null);
  const [occupancy, setOccupancy] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [tab,       setTab]       = useState("revenue");

  // occupancy filter state
  const [filterTheater, setFilterTheater] = useState("");
  const [filterFrom,    setFilterFrom]    = useState("");
  const [filterTo,      setFilterTo]      = useState("");
  const [summary,       setSummary]       = useState(null);

  useEffect(() => {
    Promise.all([getRevenueReport(), getOccupancyReport()])
      .then(([rev, occ]) => {
        if (rev.error) throw new Error(rev.error);
        setRevenue(rev);
        setOccupancy(Array.isArray(occ) ? occ : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function loadSummary() {
    getOccupancySummary({
      theaterId: filterTheater || undefined,
      from:      filterFrom    || undefined,
      to:        filterTo      || undefined,
    }).then(d => setSummary(d.error ? null : d));
  }

  function occColor(pct) {
    if (pct >= 80) return "#e74c3c";
    if (pct >= 50) return "#f39c12";
    return "#27ae60";
  }

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
        <h1>Analytics</h1>
        <p>Revenue and occupancy breakdowns across all screenings.</p>
      </div>

      {loading && <p className="loading-text">Loading analytics…</p>}
      {error   && <div className="alert-error">{error}</div>}

      {!loading && !error && revenue && (
        <>
          {/* top stats */}
          <div className="stat-grid" style={{ marginBottom: "24px" }}>
            <StatCard label="Total orders"  value={revenue.totals.total_sales} />
            <StatCard label="Tickets sold"  value={revenue.totals.total_tickets} />
            <StatCard label="Total revenue" value={`$${revenue.totals.total_revenue.toFixed(2)}`} />
            <StatCard label="Avg per order"
              value={revenue.totals.total_sales
                ? `$${(revenue.totals.total_revenue / revenue.totals.total_sales).toFixed(2)}`
                : "—"} />
          </div>

          {/* tab bar */}
          <div className="tab-bar">
            <button className={`tab ${tab === "revenue"   ? "tab--active" : ""}`} onClick={() => setTab("revenue")}>Revenue</button>
            <button className={`tab ${tab === "occupancy" ? "tab--active" : ""}`} onClick={() => setTab("occupancy")}>Occupancy</button>
          </div>

          {/* revenue tab */}
          {tab === "revenue" && (
            <div className="analytics-sections">
              <div className="panel">
                <h3>Revenue by Movie</h3>
                {revenue.by_movie.length === 0 ? <p className="empty-text">No sales yet.</p> : (
                  <div className="bar-chart">
                    {revenue.by_movie.map(m => {
                      const maxRev = revenue.by_movie[0].total_revenue || 1;
                      return (
                        <div key={m.title} className="bar-row">
                          <div className="bar-label">{m.title}</div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${Math.round((m.total_revenue / maxRev) * 100)}%` }} />
                          </div>
                          <div className="bar-value">${m.total_revenue.toFixed(2)}</div>
                          <div className="bar-meta">{m.total_tickets} tickets</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="panel">
                <h3>Revenue by Theater</h3>
                {revenue.by_theater.length === 0 ? <p className="empty-text">No sales yet.</p> : (
                  <div className="table-wrap">
                    <table className="data-table">
                      <thead><tr><th>Theater</th><th>Tickets</th><th>Revenue</th><th>Avg Price</th></tr></thead>
                      <tbody>
                        {revenue.by_theater.map(t => (
                          <tr key={t.theater_id}>
                            <td className="td-title">Theater #{t.theater_id}</td>
                            <td>{t.total_tickets}</td>
                            <td className="td-accent">${t.total_revenue.toFixed(2)}</td>
                            <td>{t.avg_price ? `$${Number(t.avg_price).toFixed(2)}` : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* occupancy tab */}
          {tab === "occupancy" && (
            <div className="panel">
              {/* filter bar */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", alignItems: "flex-end" }}>
                <div className="form-field" style={{ minWidth: "90px" }}>
                  <label>Theater ID</label>
                  <input type="number" placeholder="Any" value={filterTheater}
                    onChange={e => setFilterTheater(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>From</label>
                  <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                </div>
                <div className="form-field">
                  <label>To</label>
                  <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                </div>
                <button className="btn-primary" onClick={loadSummary}>Calculate</button>
              </div>

              {/* summary cards */}
              {summary && (
                <div className="stat-grid" style={{ marginBottom: "20px" }}>
                  <StatCard label="Avg Occupancy" value={`${summary.avg_occupancy_pct ?? "—"}%`} />
                  <StatCard label="Min Occupancy" value={`${summary.min_occupancy_pct ?? "—"}%`} />
                  <StatCard label="Max Occupancy" value={`${summary.max_occupancy_pct ?? "—"}%`} />
                  <StatCard label="Screenings"    value={summary.total_screenings ?? "—"} />
                </div>
              )}

              <h3 style={{ margin: "0 0 14px" }}>Occupancy by Screening</h3>
              {occupancy.length === 0 ? <p className="empty-text">No screening data yet.</p> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr><th>Movie</th><th>Theater</th><th>Date</th><th>Time</th><th>Sold</th><th>Left</th><th>Occupancy</th></tr>
                    </thead>
                    <tbody>
                      {occupancy.map((s, i) => {
                        const pct = s.occupancy_pct;
                        const col = occColor(pct);
                        return (
                          <tr key={i}>
                            <td className="td-title">{s.title}</td>
                            <td>Theater #{s.theater_id}</td>
                            <td className="td-nowrap">{s.screening_date}</td>
                            <td className="td-nowrap">{s.timeslot}</td>
                            <td>{s.tickets_sold}</td>
                            <td>{s.seats_remaining}</td>
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
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}