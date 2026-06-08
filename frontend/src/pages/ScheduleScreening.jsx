import { useEffect, useState } from "react";
import { getMovies, getTheaters, createScreening } from "../api";

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

export default function ScheduleScreening() {
  const role = localStorage.getItem("loggedInRole");

  const [movies,   setMovies]   = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [form,     setForm]     = useState({ title: "", theater_id: "", screening_date: "", timeslot: "" });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(null);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    getMovies().then(d   => setMovies(Array.isArray(d) ? d : []));
    getTheaters().then(d => setTheaters(Array.isArray(d) ? d : []));
  }, []);

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    const res = await createScreening({ ...form, theater_id: Number(form.theater_id) });
    setLoading(false);
    if (res.error) { setError(res.error); }
    else { setSuccess(res); setForm({ title: "", theater_id: "", screening_date: "", timeslot: "" }); }
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
        <h1>Schedule a Screening</h1>
        <p>Pick a movie, theater, date, and time.</p>
      </div>

      <div className="schedule-wrap">
        <form className="form-stack" onSubmit={handleSubmit}>

          <div className="form-field">
            <label>Movie</label>
            <select required value={form.title} onChange={set("title")}>
              <option value="">— select a movie —</option>
              {movies.map(m => <option key={m.title} value={m.title}>{m.title}</option>)}
            </select>
          </div>

          <div className="form-field">
            <label>Theater</label>
            <select required value={form.theater_id} onChange={set("theater_id")}>
              <option value="">— select a theater —</option>
              {theaters.map(t => (
                <option key={t.theater_id} value={t.theater_id}>
                  Theater #{t.theater_id} — {t.max_seats} seats
                  {t.is_3d ? " · 3D" : ""}
                  {t.has_sound ? " · Fancy Sound" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Date</label>
              <input type="date" required value={form.screening_date} onChange={set("screening_date")}
                min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="form-field">
              <label>Start time (10:00 – 23:59)</label>
              <input type="time" required value={form.timeslot} onChange={set("timeslot")}
                min="10:00" max="23:59" />
            </div>
          </div>

          {error   && <div className="alert-error">{error}</div>}
          {success && (
            <div className="alert-success">
              ✓ Scheduled — Theater #{success.theater_id} · {success.title} · {fmtDate(success.screening_date)} at {fmt12hr(success.timeslot)}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Scheduling…" : "Schedule Screening"}
          </button>

        </form>
      </div>
    </div>
  );
}