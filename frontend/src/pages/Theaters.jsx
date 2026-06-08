import { useEffect, useState } from "react";
import { getTheaters } from "../api";

function TheaterCard({ theater }) {
  const { theater_id, max_seats, is_3d, has_sound } = theater;
  return (
    <div className="theater-card">
      <div className="theater-card-header">
        <div className="theater-icon">🎭</div>
        <div>
          <div className="theater-label">Theater</div>
          <div className="theater-number">#{theater_id}</div>
        </div>
      </div>
      <div className="theater-seats">
        <span>🪑</span>
        <span><strong>{max_seats}</strong> seats</span>
      </div>
      <div className="badge-row">
        <span className={`badge ${is_3d    ? "badge--on" : "badge--off"}`}>3D</span>
        <span className={`badge ${has_sound ? "badge--on" : "badge--off"}`}>Fancy Sound</span>
      </div>
    </div>
  );
}

export default function Theaters() {
  const [theaters, setTheaters] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    getTheaters()
      .then(d => { if (d.error) throw new Error(d.error); setTheaters(d); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Facilities</p>
        <h1>Our Theaters</h1>
        {!loading && <p>{theaters.length} screen{theaters.length !== 1 ? "s" : ""} available</p>}
      </div>
      {loading && <p className="loading-text">Loading theaters…</p>}
      {error   && <div className="alert-error">{error}</div>}
      {!loading && !error && (
        <div className="theater-grid">
          {theaters.map(t => <TheaterCard key={t.theater_id} theater={t} />)}
        </div>
      )}
    </div>
  );
}