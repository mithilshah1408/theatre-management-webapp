// All API calls go through this base URL.
// Set VITE_API_URL in your .env file (e.g. http://127.0.0.1:5000)
const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

async function post(path, body) {
  const r = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  return r.json();
}

async function get(path) {
  const r = await fetch(`${BASE}${path}`);
  return r.json();
}

async function del(path) {
  const r = await fetch(`${BASE}${path}`, { method: "DELETE" });
  return r.json();
}

// ── Auth ──────────────────────────────────────────────────────
// Single endpoint — backend detects client vs admin automatically
export const loginUser      = (body)       => post("/login", body);
export const registerClient = (body)       => post("/register", body);

// ── Movies ───────────────────────────────────────────────────
export const getMovies      = ()           => get("/movies");
export const searchMovies   = (q)          => get(`/movies/search?q=${encodeURIComponent(q)}`);

// ── Theaters ─────────────────────────────────────────────────
export const getTheaters    = ()           => get("/theaters");

// ── Screenings ───────────────────────────────────────────────
export const getScreenings  = ()           => get("/screenings");
export const searchScreenings = (params)   => {
  const q = new URLSearchParams();
  if (params.title)      q.append("title",      params.title);
  if (params.date)       q.append("date",       params.date);
  if (params.time_after) q.append("time_after", params.time_after);
  return get(`/screenings/search?${q}`);
};

// ── Tickets ───────────────────────────────────────────────────
export const buyTickets  = (body)          => post("/tickets", body);
export const getTickets  = (email)         => get(`/tickets?email=${encodeURIComponent(email)}`);

// ── Payments ─────────────────────────────────────────────────
export const getClientPayments  = (email)           => get(`/clients/${email}/payments`);
export const addCreditPayment   = (email, body)     => post(`/clients/${email}/payments/credit`, body);
export const addDebitPayment    = (email, body)      => post(`/clients/${email}/payments/debit`, body);
export const deletePayment      = (id, email)        => del(`/payments/${id}?email=${encodeURIComponent(email)}`);

// ── Rewards ───────────────────────────────────────────────────
export const getRewards = (email)          => get(`/clients/${email}/rewards`);

// ── Persons ───────────────────────────────────────────────────
export const getPersons = ()               => get("/persons");
export const getPerson  = (name)           => get(`/persons/${encodeURIComponent(name)}`);

// ── Admin ─────────────────────────────────────────────────────
export const createScreening        = (body) => post("/admin/screenings", body);
export const getScreeningsCapacity  = ()     => get("/admin/screenings/capacity");
export const getAnalytics           = ()     => get("/admin/analytics");
export const getRevenueReport       = ()     => get("/admin/reports/revenue");
export const getOccupancyReport     = ()     => get("/admin/reports/occupancy");
export const getOccupancySummary    = ({ theaterId, from, to } = {}) => {
  const q = new URLSearchParams();
  if (theaterId) q.append("theater_id", theaterId);
  if (from)      q.append("from", from);
  if (to)        q.append("to",   to);
  return get(`/admin/reports/occupancy/summary?${q}`);
};

// ── Waitlist ──────────────────────────────────────────────────
export const joinWaitlist = (body)          => post("/waitlist", body);
export const getWaitlist  = (email)         => get(`/waitlist?email=${encodeURIComponent(email)}`);
export const leaveWaitlist = (id, email)    => del(`/waitlist/${id}?email=${encodeURIComponent(email)}`);
export const getWaitlistPosition = ({ email, title, theater_id, screen_id }) => {
  const q = new URLSearchParams({ email, title, theater_id, screen_id });
  return get(`/waitlist/position?${q}`);
};