import { useEffect, useState } from "react";
import {
  getClientPayments, addCreditPayment, addDebitPayment, deletePayment,
  getRewards, getWaitlist, leaveWaitlist,
} from "../api";

function fmt12hr(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

// ── Rewards card ──────────────────────────────────────────────
function RewardsCard({ email }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getRewards(email).then(d => setData(d.error ? null : d));
  }, [email]);

  if (!data) return null;
  if (!data.enrolled) return (
    <div className="panel" style={{ textAlign: "center" }}>
      <p style={{ color: "#7da9c0", margin: 0 }}>You haven't enrolled in BlueMuse Rewards yet.</p>
    </div>
  );

  const pct = (data.progress / 10) * 100;

  return (
    <div className="panel">
      <h3>🎁 BlueMuse Rewards</h3>
      <p style={{ color: "#3e6784", fontSize: "0.9rem", margin: "0 0 14px" }}>
        Earn a free ticket every 10 movies you watch.
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#3e6784", marginBottom: "6px" }}>
        <span>{data.progress} / 10 toward next free ticket</span>
        <span>{data.next_free_at} more to go</span>
      </div>
      <div className="rewards-bar-track">
        <div className="rewards-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div style={{ display: "flex", gap: "20px", marginTop: "14px", flexWrap: "wrap" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#14334c", fontWeight: 800, fontSize: "1.4rem" }}>{data.total_tickets}</div>
          <div style={{ color: "#7da9c0", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>Total watched</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#27ae60", fontWeight: 800, fontSize: "1.4rem" }}>{data.free_earned}</div>
          <div style={{ color: "#7da9c0", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px" }}>Free tickets earned</div>
        </div>
      </div>
    </div>
  );
}

// ── Waitlist card ─────────────────────────────────────────────
function WaitlistCard({ email }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    getWaitlist(email)
      .then(d => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [email]);

  async function handleLeave(id) {
    await leaveWaitlist(id, email);
    load();
  }

  if (loading) return null;
  if (items.length === 0) return (
    <div className="panel">
      <h3>📋 Your Waitlist</h3>
      <p className="empty-text" style={{ padding: "16px 0" }}>You're not on any waitlists.</p>
    </div>
  );

  return (
    <div className="panel">
      <h3>📋 Your Waitlist</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {items.map(w => (
          <div key={w.waitlist_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #e2f4ff" }}>
            <div>
              <div style={{ fontWeight: 700, color: "#14334c", fontSize: "0.9rem" }}>{w.title}</div>
              <div style={{ color: "#7da9c0", fontSize: "0.78rem" }}>
                Theater #{w.theater_id}
                {w.screening_date && ` · ${w.screening_date}`}
                {w.timeslot && ` at ${fmt12hr(w.timeslot)}`}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <span className={`waitlist-badge ${w.status === "notified" ? "waitlist-notified" : ""}`}>
                {w.status === "notified" ? "🎉 Spot available!" : `#${w.position} in queue`}
              </span>
              <button className="btn-danger" onClick={() => handleLeave(w.waitlist_id)}>Leave</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main account page ─────────────────────────────────────────
export default function Account() {
  const email = localStorage.getItem("loggedInEmail");
  const name  = localStorage.getItem("loggedInName");
  const role  = localStorage.getItem("loggedInRole");

  const [payments,    setPayments]    = useState([]);
  const [cardType,    setCardType]    = useState("debit");
  const [cardNumber,  setCardNumber]  = useState("");
  const [billing,     setBilling]     = useState("");
  const [message,     setMessage]     = useState("");
  const [msgType,     setMsgType]     = useState("error"); // "error" | "success"

  function loadPayments() {
    if (!email || role !== "client") return;
    getClientPayments(email).then(d => { if (!d.error) setPayments(d); });
  }
  useEffect(() => { loadPayments(); }, []);

  function handleAddPayment(e) {
    e.preventDefault();
    const clean = cardNumber.replace(/\D/g, "");
    if (clean.length !== 16) { setMsgType("error"); setMessage("Card number must be 16 digits."); return; }
    if (cardType === "credit" && !billing) { setMsgType("error"); setMessage("Billing address required for credit cards."); return; }

    const req = cardType === "credit"
      ? addCreditPayment(email, { card_number: clean, billing_address: billing })
      : addDebitPayment(email, { card_number: clean });

    req.then(d => {
      if (d.error) { setMsgType("error"); setMessage(d.error); }
      else { setMsgType("success"); setMessage("Payment method added!"); setCardNumber(""); setBilling(""); loadPayments(); }
    });
  }

  function handleDelete(id) {
    deletePayment(id, email).then(d => {
      if (d.error) { setMsgType("error"); setMessage(d.error); }
      else { setMsgType("success"); setMessage("Payment method removed."); loadPayments(); }
    });
  }

  if (!email || role !== "client") return (
    <div className="access-denied">
      <div className="icon">🔒</div>
      <h2>Client access only</h2>
      <p>Please <a href="/login" style={{ color: "#258ccc" }}>sign in</a> as a client.</p>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <p className="eyebrow">My Account</p>
        <h1>Hey, {name || "there"} 👋</h1>
        <p>Manage your payment methods, rewards, and waitlist.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* rewards */}
        <RewardsCard email={email} />

        {/* waitlist */}
        <WaitlistCard email={email} />

        {/* payments */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="login-grid">

          {/* add payment */}
          <form className="form-card" onSubmit={handleAddPayment}>
            <h2>Add Payment Method</h2>
            <p className="form-note">Credit cards require a billing address.</p>

            <label>Card Type</label>
            <select value={cardType} onChange={e => { setCardType(e.target.value); setMessage(""); }}>
              <option value="debit">Debit Card</option>
              <option value="credit">Credit Card</option>
            </select>

            <label>Card Number</label>
            <input
              type="text"
              placeholder="0000-0000-0000-0000"
              value={cardNumber}
              maxLength={19}
              onChange={e => {
                const nums = e.target.value.replace(/\D/g, "").slice(0, 16);
                setCardNumber(nums.replace(/(.{4})/g, "$1-").replace(/-$/, ""));
              }}
              required
            />

            {cardType === "credit" && (
              <>
                <label>Billing Address</label>
                <input type="text" placeholder="Enter billing address" value={billing}
                  onChange={e => setBilling(e.target.value)} required />
              </>
            )}

            <button type="submit">Add Payment</button>
            {message && <p className={`form-message ${msgType === "success" ? "" : ""}`}
              style={{ color: msgType === "success" ? "#27ae60" : "#e74c3c" }}>{message}</p>}
          </form>

          {/* saved methods */}
          <div className="form-card">
            <h2>Saved Cards</h2>
            <p className="form-note">Cards connected to your account.</p>
            {payments.length === 0
              ? <p className="form-note">No cards saved yet.</p>
              : payments.map(p => (
                <div key={p.payment_id} style={{ padding: "12px 0", borderBottom: "1px solid #e2f4ff" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#14334c", fontSize: "0.9rem" }}>
                        {p.type === "credit" ? "💳 Credit Card" : "💳 Debit Card"}
                      </p>
                      <p style={{ margin: "0", color: "#7da9c0", fontSize: "0.8rem" }}>
                        ···· ···· ···· {p.card_number?.slice(-4)}
                      </p>
                      {p.billing_address && (
                        <p style={{ margin: "2px 0 0", color: "#3e6784", fontSize: "0.78rem" }}>{p.billing_address}</p>
                      )}
                    </div>
                    <button className="btn-danger" onClick={() => handleDelete(p.payment_id)}>Remove</button>
                  </div>
                </div>
              ))
            }
          </div>

        </div>
      </div>
    </div>
  );
}