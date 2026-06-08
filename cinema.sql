-- ============================================================
-- BlueMuse Cinema — Database Schema
-- ============================================================

-- ── Section 0: Staff ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Administrator (
    email_address TEXT PRIMARY KEY,
    password      TEXT NOT NULL   -- stored as werkzeug scrypt hash
);

-- ── Section 1: Clients & Payments ────────────────────────────
CREATE TABLE IF NOT EXISTS Client (
    email_address   TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    address         TEXT NOT NULL,
    password        TEXT NOT NULL, -- stored as werkzeug scrypt hash
    movie_interests TEXT,
    rewards_program BOOLEAN DEFAULT FALSE
);

-- one client → many payment methods
CREATE TABLE IF NOT EXISTS Paymentmethod (
    payment_id    SERIAL PRIMARY KEY,
    email_address TEXT NOT NULL,
    FOREIGN KEY (email_address)
        REFERENCES Client(email_address) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Debitcard (
    payment_id  INT PRIMARY KEY,
    card_number TEXT NOT NULL UNIQUE,
    FOREIGN KEY (payment_id)
        REFERENCES Paymentmethod(payment_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Creditcard (
    payment_id      INT PRIMARY KEY,
    card_number     TEXT NOT NULL UNIQUE,
    billing_address TEXT NOT NULL,
    FOREIGN KEY (payment_id)
        REFERENCES Paymentmethod(payment_id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ── Section 2: Theaters, Movies, Screenings ──────────────────
CREATE TABLE IF NOT EXISTS Theater (
    theater_id SERIAL PRIMARY KEY,
    max_seats  INT  NOT NULL,
    features   TEXT          -- e.g. '3D', 'Fancy sound', '3D, Fancy sound'
);

CREATE TABLE IF NOT EXISTS Movie (
    title             TEXT PRIMARY KEY,
    release_date      DATE NOT NULL,
    runtime           INT  NOT NULL,
    original_language TEXT NOT NULL,
    major_studio      BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS Language (
    language_name TEXT PRIMARY KEY
);

-- weak entity: exists only in relation to Movie + Theater
CREATE TABLE IF NOT EXISTS Screening (
    title          TEXT NOT NULL,
    theater_id     INT  NOT NULL,
    screen_id      INT  NOT NULL,
    screening_date DATE NOT NULL,
    timeslot       TIME NOT NULL,
    PRIMARY KEY (title, theater_id, screen_id),
    UNIQUE (theater_id, screening_date, timeslot), -- no double-booking
    FOREIGN KEY (title)      REFERENCES Movie(title)       ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (theater_id) REFERENCES Theater(theater_id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ticket sales: NULL payment_id / email_address = anonymous purchase
CREATE TABLE IF NOT EXISTS Ticketsale (
    order_id         SERIAL PRIMARY KEY,
    payment_id       INT,
    email_address    TEXT,
    num_sold         INT            NOT NULL,
    price_per_ticket DECIMAL(10, 2),          -- locked at time of purchase
    sale_timestamp   TIMESTAMP DEFAULT NOW(),
    title            TEXT NOT NULL,
    theater_id       INT  NOT NULL,
    screen_id        INT  NOT NULL,
    FOREIGN KEY (payment_id)
        REFERENCES Paymentmethod(payment_id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (email_address)
        REFERENCES Client(email_address)     ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (title, theater_id, screen_id)
        REFERENCES Screening(title, theater_id, screen_id)  ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticketsale_email     ON Ticketsale(email_address);
CREATE INDEX IF NOT EXISTS idx_ticketsale_timestamp ON Ticketsale(sale_timestamp);
CREATE INDEX IF NOT EXISTS idx_ticketsale_screening ON Ticketsale(title, theater_id, screen_id);

CREATE TABLE IF NOT EXISTS MovieLanguage (
    title         TEXT NOT NULL,
    language_name TEXT NOT NULL,
    PRIMARY KEY (title, language_name),
    FOREIGN KEY (title)         REFERENCES Movie(title)    ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (language_name) REFERENCES Language(language_name) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ── Section 3: People & Roles ─────────────────────────────────
-- NOTE: Using name as PK for simplicity; in production this would be
-- person_id SERIAL + unique name constraint.
CREATE TABLE IF NOT EXISTS Person (
    name      TEXT NOT NULL PRIMARY KEY,
    birthday  DATE NOT NULL,
    biography TEXT
);

CREATE TABLE IF NOT EXISTS Award (
    award_name TEXT     NOT NULL,
    year       SMALLINT,
    role       TEXT     NOT NULL,
    name       TEXT     NOT NULL,
    title      TEXT     NOT NULL,
    PRIMARY KEY (award_name, year, role),
    FOREIGN KEY (name)  REFERENCES Person(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (title) REFERENCES Movie(title) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Directed (
    name  TEXT NOT NULL,
    title TEXT NOT NULL,
    PRIMARY KEY (name, title),
    FOREIGN KEY (name)  REFERENCES Person(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (title) REFERENCES Movie(title) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Produced (
    name  TEXT NOT NULL,
    title TEXT NOT NULL,
    PRIMARY KEY (name, title),
    FOREIGN KEY (name)  REFERENCES Person(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (title) REFERENCES Movie(title) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Scripted (
    name  TEXT NOT NULL,
    title TEXT NOT NULL,
    PRIMARY KEY (name, title),
    FOREIGN KEY (name)  REFERENCES Person(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (title) REFERENCES Movie(title) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS StarsIn (
    name           TEXT NOT NULL,
    title          TEXT NOT NULL,
    character_name TEXT NOT NULL,
    PRIMARY KEY (name, title, character_name),
    FOREIGN KEY (name)  REFERENCES Person(name) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (title) REFERENCES Movie(title) ON UPDATE CASCADE ON DELETE CASCADE
);

-- ── Section 4: Waitlist (special feature) ────────────────────
-- When a screening is sold out, clients can join the waitlist.
-- The system tracks their queue position and notifies them
-- when new seats become available or a new screening is added.
CREATE TABLE IF NOT EXISTS Waitlist (
    waitlist_id   SERIAL PRIMARY KEY,
    email_address TEXT NOT NULL,
    title         TEXT NOT NULL,
    theater_id    INT  NOT NULL,
    screen_id     INT  NOT NULL,
    joined_at     TIMESTAMP DEFAULT NOW(),
    position      INT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'waiting',
        -- 'waiting'   → in queue
        -- 'notified'  → a spot or new screening opened — client has 30 min priority
        -- 'cancelled' → client left the waitlist
    UNIQUE (email_address, title, theater_id, screen_id),
    FOREIGN KEY (email_address)
        REFERENCES Client(email_address) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (title, theater_id, screen_id)
        REFERENCES Screening(title, theater_id, screen_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email     ON Waitlist(email_address);
CREATE INDEX IF NOT EXISTS idx_waitlist_screening ON Waitlist(title, theater_id, screen_id);