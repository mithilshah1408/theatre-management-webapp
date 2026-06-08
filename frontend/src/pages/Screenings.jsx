import { useEffect, useState } from "react";
import {
  getScreenings, searchScreenings,
  getClientPayments, buyTickets,
  joinWaitlist, leaveWaitlist, getWaitlistPosition,
} from "../api";

// ── helpers ───────────────────────────────────────────────────

function fmt12hr(t) {
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

function barColor(pct) {
  if (pct >= 90) return "#e74c3c";
  if (pct >= 70) return "#e67e22";
  return "#258ccc";
}

// ── sub-components ────────────────────────────────────────────

function SeatBar({ sold, total }) {
  const pct   = Math.round((sold / total) * 100);
  const color = barColor(pct);
  return (
    <div className="seat-bar">
      <div className="seat-bar-info">
        <span className="seats-left">{total - sold} seats left</span>
        <span className="seats-pct">{pct}% full</span>
      </div>
      <div className="seat-bar-track">
        <div className="seat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function ScreeningCard({ screening, email, onBook, onWaitlistChange }) {
  const {
    title, theater_id, screen_id, screening_date, timeslot,
    max_seats, tickets_sold, available_seats,
    price, is_3d, has_sound, original_language,
  } = screening;

  const soldOut = available_seats <= 0;

  const [wl, setWl] = useState(null); // { on_waitlist, position, status, total_waiting }

  useEffect(() => {
    if (soldOut && email) {
      getWaitlistPosition({ email, title, theater_id, screen_id })
        .then(d => setWl(d));
    }
  }, [soldOut, email]);

  async function handleWaitlist() {
    if (!email) { window.location.href = "/login"; return; }
    if (wl?.on_waitlist) {
      // need waitlist_id — fetch from account, easier to just block for now
      // In practice the Account page handles leaving; here we just show position
      return;
    }
    const res = await joinWaitlist({ email_address: email, title, theater_id, screen_id });
    if (!res.error) {
      setWl({ on_waitlist: true, position: res.position, status: "waiting" });
      if (onWaitlistChange) onWaitlistChange();
    }
  }

  return (
    <div className={`screening-card ${soldOut ? "screening-card--sold-out" : ""}`}>
      <div className="screening-top">
        <div>
          <div className="screening-title">{title}</div>
          <div className="screening-datetime">{fmtDate(screening_date)} · {fmt12hr(timeslot)}</div>
        </div>
        <div className="screening-price">
          ${price}
          <span>per ticket</span>
        </div>
      </div>

      <div className="screening-meta">
        <span>🎭 Theater #{theater_id}</span>
        <span>🌐 {original_language}</span>
      </div>

      {(is_3d || has_sound) && (
        <div className="pill-row">
          {is_3d     && <span className="pill">3D</span>}
          {has_sound && <span className="pill">Fancy Sound</span>}
        </div>
      )}

      <SeatBar sold={Number(tickets_sold)} total={Number(max_seats)} />

      {!soldOut ? (
        <button className="btn-book" onClick={() => onBook(screening)}>
          Book Tickets
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {wl?.on_waitlist ? (
            <div className={`waitlist-badge ${wl.status === "notified" ? "waitlist-notified" : ""}`}>
              {wl.status === "notified"
                ? "🎉 A spot opened — book now!"
                : `📋 Waitlist position #${wl.position}`}
            </div>
          ) : (
            <button className="btn-waitlist" onClick={handleWaitlist}>
              📋 Join Waitlist
            </button>
          )}
          <div style={{ color: "#7da9c0", fontSize: "0.75rem", textAlign: "center" }}>
            Sold out
          </div>
        </div>
      )}
    </div>
  );
}

// ── booking modal ─────────────────────────────────────────────

function BookingModal({ screening, email, onClose, onSuccess }) {
  const [payments,   setPayments]   = useState([]);
  const [paymentId,  setPaymentId]  = useState("");
  const [numTickets, setNumTickets] = useState(1);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [confirmed,  setConfirmed]  = useState(null);

  const { title, theater_id, screen_id, screening_date, timeslot, available_seats, price, is_3d, has_sound } = screening;

  useEffect(() => {
    if (email) getClientPayments(email).then(d => setPayments(Array.isArray(d) ? d : []));
  }, [email]);

  const total = (price * numTickets).toFixed(2);

  async function handleSubmit() {
    setLoading(true); setError(null);
    const res = await buyTickets({
      title, theater_id, screen_id,
      num_tickets:   numTickets,
      email_address: email || null,
      payment_id:    paymentId ? Number(paymentId) : null,
    });
    setLoading(false);
    if (res.error) { setError(res.error); }
    else           { setConfirmed(res); if (onSuccess) onSuccess(); }
  }

  if (confirmed) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-success" onClick={e => e.stopPropagation()}>
        <div className="success-icon">🎬</div>
        <div>
          <p className="success-title">You're all set!</p>
          <p className="success-desc">
            {confirmed.num_tickets} ticket{confirmed.num_tickets > 1 ? "s" : ""} booked for <strong>{title}</strong>
          </p>
        </div>
        <div className="price-summary">
          <div className="price-summary-row"><span>Per ticket</span><span>${confirmed.price_per_ticket}</span></div>
          <div className="price-summary-total"><span className="label">Total paid</span><span className="value">${confirmed.total_price}</span></div>
        </div>
        <button className="btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div>
          <p className="modal-eyebrow">Booking</p>
          <p className="modal-title">{title}</p>
          <p className="modal-subtitle">{fmtDate(screening_date)} · {fmt12hr(timeslot)} · Theater #{theater_id}</p>
          {(is_3d || has_sound) && (
            <div className="pill-row" style={{ marginTop: "8px" }}>
              {is_3d     && <span className="pill">3D</span>}
              {has_sound && <span className="pill">Fancy Sound</span>}
            </div>
          )}
        </div>

        <div className="modal-field">
          <label>Number of tickets (max {available_seats})</label>
          <input type="number" min={1} max={available_seats} value={numTickets}
            onChange={e => setNumTickets(Math.max(1, Math.min(Number(e.target.value), available_seats)))} />
        </div>

        {email ? (
          <div className="modal-field">
            <label>Payment method</label>
            {payments.length === 0
              ? <p className="modal-no-payment">No payment methods saved. Add one in Account.</p>
              : <select value={paymentId} onChange={e => setPaymentId(e.target.value)}>
                  <option value="">— select —</option>
                  {payments.map(p => (
                    <option key={p.payment_id} value={p.payment_id}>
                      {p.type === "credit" ? "💳 Credit" : "💳 Debit"} ···{p.card_number?.slice(-4)}
                    </option>
                  ))}
                </select>
            }
          </div>
        ) : (
          <p className="modal-guest-note">Buying as guest — no login required.</p>
        )}

        <div className="price-summary">
          <div className="price-summary-row"><span>${price} × {numTickets}</span><span>${total}</span></div>
          <div className="price-summary-total"><span className="label">Total</span><span className="value">${total}</span></div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <button className="btn-primary"
          style={{ width: "100%" }}
          onClick={handleSubmit}
          disabled={loading || (email && (!paymentId || payments.length === 0))}>
          {loading ? "Processing…" : `Confirm — $${total}`}
        </button>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────

export default function Screenings() {
  const [screenings, setScreenings] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [search,     setSearch]     = useState({ title: "", date: "", time_after: "" });

  const email = localStorage.getItem("loggedInEmail") || null;

  function fetchScreenings(params = {}) {
    setLoading(true); setError(null);
    const hasFilter = params.title || params.date || params.time_after;
    (hasFilter ? searchScreenings(params) : getScreenings())
      .then(d => { if (d.error) throw new Error(d.error); setScreenings(d); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchScreenings(); }, []);

  function handleSearch(e) { e.preventDefault(); fetchScreenings(search); }
  function handleReset()   { setSearch({ title: "", date: "", time_after: "" }); fetchScreenings(); }

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">Schedule</p>
        <h1>Now Showing</h1>
        <p>Search and book tickets for upcoming screenings.</p>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="search-field search-field--wide">
          <label>Movie title</label>
          <input value={search.title}
            onChange={e => setSearch(s => ({ ...s, title: e.target.value }))}
            placeholder="e.g. Howl's Moving Castle" />
        </div>
        <div className="search-field">
          <label>Date</label>
          <input type="date" value={search.date}
            onChange={e => setSearch(s => ({ ...s, date: e.target.value }))} />
        </div>
        <div className="search-field">
          <label>After</label>
          <input type="time" value={search.time_after}
            onChange={e => setSearch(s => ({ ...s, time_after: e.target.value }))} />
        </div>
        <div className="search-actions">
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" className="btn-outline" onClick={handleReset}>Reset</button>
        </div>
      </form>

      {!loading && !error && (
        <p className="results-count">{screenings.length} screening{screenings.length !== 1 ? "s" : ""} found</p>
      )}

      {loading && <p className="loading-text">Loading screenings…</p>}
      {error   && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <div className="screening-grid">
          {screenings.map(s => (
            <ScreeningCard
              key={`${s.title}-${s.theater_id}-${s.screen_id}`}
              screening={s}
              email={email}
              onBook={setSelected}
              onWaitlistChange={() => fetchScreenings(search)}
            />
          ))}
          {screenings.length === 0 && (
            <p className="empty-text" style={{ gridColumn: "1/-1" }}>No screenings match your search.</p>
          )}
        </div>
      )}

      {selected && (
        <BookingModal
          screening={selected}
          email={email}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); fetchScreenings(search); }}
        />
      )}
    </div>
  );
}