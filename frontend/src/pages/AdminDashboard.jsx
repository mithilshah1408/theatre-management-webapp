import { useEffect, useState } from "react";
import { getAnalytics } from "../api";

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const role      = localStorage.getItem("loggedInRole");
  const adminName = localStorage.getItem("loggedInName") || "Admin";

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getAnalytics()
      .then(d => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (role !== "admin") return (
    <div className="access-denied">
      <div className="icon">🚫</div>
      <h2>Admin access only</h2>
      <p>Please sign in as an administrator.</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Admin Dashboard</p>
        <h1>Welcome back, {adminName}</h1>
        <p>Ticket sales and revenue overview.</p>
      </div>

      {loading && <p className="loading-text">Loading analytics…</p>}
      {error   && <div className="alert-error">{error}</div>}

      {!loading && !error && data && (() => {
        const { totals, by_movie, by_theater } = data;
        const maxRev = by_movie.length ? by_movie[0].total_revenue || 1 : 1;
        return (
          <div className="analytics-sections">

            <div className="stat-grid">
              <StatCard label="Total orders"  value={totals.total_sales} />
              <StatCard label="Tickets sold"  value={totals.total_tickets} />
              <StatCard label="Total revenue" value={`$${totals.total_revenue.toFixed(2)}`} />
              <StatCard label="Avg per order"
                value={totals.total_sales ? `$${(totals.total_revenue / totals.total_sales).toFixed(2)}` : "—"} />
            </div>

            <div className="panel">
              <h3>Revenue by Movie</h3>
              {by_movie.length === 0 ? <p className="empty-text">No data yet.</p> : (
                <div className="bar-chart">
                  {by_movie.map(m => (
                    <div key={m.title} className="bar-row">
                      <div className="bar-label">{m.title}</div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${Math.round((m.total_revenue / maxRev) * 100)}%` }} />
                      </div>
                      <div className="bar-value">${m.total_revenue.toFixed(2)}</div>
                      <div className="bar-meta">{m.total_tickets} tickets</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel">
              <h3>Revenue by Theater</h3>
              {by_theater.length === 0 ? <p className="empty-text">No data yet.</p> : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Theater</th><th>Tickets</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {by_theater.map(t => (
                        <tr key={t.theater_id}>
                          <td className="td-title">Theater #{t.theater_id}</td>
                          <td>{t.total_tickets}</td>
                          <td className="td-accent">${t.total_revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        );
      })()}
    </div>
  );
}