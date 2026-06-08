# 🎬 BlueMuse Cinema — Theatre Management Web App

A full-stack cinema ticketing and management system built with React, Flask, and PostgreSQL. Designed to solve real operational problems a theatre would face — from preventing concurrent overbooking to managing sold-out screenings with a live waitlist queue.

---

## Live Demo

> Clone the repo, run one command, and the entire app is live at `http://localhost:5173`.

**Try it instantly — no setup needed beyond Docker:**

| Role | Email | Password |
|------|-------|----------|
| 🔐 Admin | mrboss@smilingfriends.com | boss123 |
| 🎬 Client — Saja | saja2141@gmail.com | saja123 |
| 🎟️ Client — Jordy | jpine25@uic.edu | jordy123 |

> Or just click the one-tap demo buttons on the login page.

---

## Quick Start

**Requirements:** Docker Desktop (nothing else)

```bash
git clone https://github.com/mithilshah1408/theatre-management-webapp.git
cd theatre-management-webapp/480project
docker compose up --build
```

Open `http://localhost:5173`. The database seeds itself automatically.

**Reset everything:**
```bash
docker compose down -v
docker compose up --build
```

---

## What It Does

### Client Features
- Browse movies with full cast, crew, director, and language details
- Search and filter screenings by title, date, and time
- Book tickets with saved payment methods — seat availability updates live
- Join a **waitlist** for sold-out screenings and get notified when new spots open
- Track ticket purchase history
- **BlueMuse Rewards** — earn a free ticket every 10 movies watched
- Manage saved debit and credit cards

### Admin Features
- Schedule new screenings with automatic overlap detection and opening hours validation
- Live **Capacity Monitor** — real-time occupancy across all theaters with color-coded bars
- **Analytics Dashboard** — revenue breakdown by movie and theater, total tickets sold
- Occupancy reports with filtering by theater and date range

---

## The Special Feature — Waitlist System

Most student cinema projects stop at booking. BlueMuse includes a full waitlist queue for sold-out screenings.

When a screening sells out, clients see a **Join Waitlist** button instead of Book. The system:
- Assigns a queue position to each client
- Automatically flips all waitlisted users to **notified** status when the admin schedules a new screening of the same movie
- Shows the notification in the client's Account page
- Clients can leave the waitlist at any time

This required designing for real-world edge cases: concurrent bookings, cascade updates across tables, and business logic that runs automatically on insert.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend | Python 3.12, Flask, Flask-CORS |
| Database | PostgreSQL 16 |
| Auth | Werkzeug scrypt password hashing |
| Containerisation | Docker, Docker Compose, Nginx |

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│   Flask REST    │────▶│  PostgreSQL 16  │
│   Nginx :5173   │     │   API :5000     │     │   cinema_db     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

All three services run in Docker. The DB seeds itself on first boot via `/docker-entrypoint-initdb.d`. Flask waits for the DB healthcheck before starting. Nginx handles React Router with `try_files` so direct URL access works correctly.

---

## Database Design

15+ tables covering the full domain. Key design decisions:

**Screening** is a weak entity — its primary key is `(title, theater_id, screen_id)`. It only exists in relation to a Movie and a Theater. A `UNIQUE(theater_id, screening_date, timeslot)` constraint enforces no double-booking at the database level.

**Ticketsale** stores `price_per_ticket` at the time of purchase rather than recalculating it. This preserves transaction integrity — a price change doesn't retroactively alter past sales.

**Waitlist** tracks `position` and `status` (`waiting` → `notified` → `cancelled`). Status updates cascade automatically when relevant business events happen.

**Indexes** on `Ticketsale(email_address)`, `Ticketsale(sale_timestamp)`, `Ticketsale(title, theater_id, screen_id)`, and both Waitlist foreign keys keep analytics queries fast as data grows.

```
Administrator          Client
     │                   │
     │              PaymentMethod
     │               ├── Debitcard
     │               └── Creditcard
     │
Theater ──── Screening (weak) ──── Movie ──── MovieLanguage ──── Language
                  │                  │
             Ticketsale           StarsIn / Directed / Scripted / Produced
                                     │
             Waitlist              Person ──── Award
```

---

## Project Structure

```
480project/
├── docker-compose.yml          # orchestrates all 3 services
├── cinema.sql                  # full database schema
├── demo.sql                    # seed data — 62 screenings, 4 users, rich analytics
├── backend/
│   ├── Dockerfile
│   ├── application.py          # Flask REST API — 25+ routes
│   └── requirements.txt
└── frontend/
    ├── Dockerfile              # multi-stage: Node builds, Nginx serves
    ├── nginx.conf              # React Router support
    └── src/
        ├── api.js              # all API calls in one place
        ├── App.jsx             # routes
        ├── components/
        │   └── Router.jsx      # nav with mobile hamburger
        └── pages/
            ├── Home.jsx
            ├── Login.jsx       # single form, auto-detects role
            ├── Movies.jsx
            ├── Screenings.jsx  # booking + waitlist
            ├── Theaters.jsx
            ├── Tickets.jsx
            ├── Account.jsx     # rewards + waitlist + payments
            ├── Stars.jsx
            ├── AdminDashboard.jsx
            ├── ScheduleScreening.jsx
            ├── CapacityMonitor.jsx
            └── Analytics.jsx
```

---

## API Overview

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/login` | Single endpoint — detects client vs admin |
| POST | `/register` | Create new client account |
| GET | `/movies` | All movies with cast and crew |
| GET | `/screenings` | All upcoming screenings with live seat counts |
| GET | `/screenings/search` | Filter by title, date, time |
| POST | `/tickets` | Buy tickets — row-locked against overbooking |
| GET | `/tickets?email=` | Client ticket history |
| GET | `/clients/:email/rewards` | Rewards progress |
| POST | `/waitlist` | Join waitlist for sold-out screening |
| GET | `/waitlist?email=` | Client's active waitlist entries |
| DELETE | `/waitlist/:id` | Leave waitlist |
| GET | `/admin/analytics` | Revenue and ticket totals |
| GET | `/admin/screenings/capacity` | Live occupancy for all screenings |
| POST | `/admin/screenings` | Schedule new screening |
| GET | `/persons/:name` | Person profile with filmography and awards |

---

## Security

- Passwords hashed with **scrypt** via Werkzeug — never stored in plain text
- Single `/login` endpoint checks both tables — role is returned from the server, not set by the client
- Payment card numbers masked in all API responses — only last 4 digits exposed
- Database credentials injected via environment variables — not hardcoded

---

## Demo Data Highlights

The seed data is designed to tell a story immediately on first load:

- **Dune: Part Two** at Theater 3 (premium screen) is sold out — the waitlist button shows immediately
- **Spider-Man** is 85% full — urgency in the seat bar
- **Saja** has rewards at 8/10 — two more tickets from a free one
- **62 screenings** spread from June 2026 through December 2027 — the schedule always looks full
- **$6,632 revenue** across 461 tickets — analytics dashboard looks real on day one
