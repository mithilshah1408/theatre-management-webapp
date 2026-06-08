-- ============================================================
-- BlueMuse Cinema — Demo Seed Data
-- ============================================================
-- Run AFTER cinema.sql on a fresh database.
--
-- What this sets up:
--   25 screenings across 13 days (including TODAY)
--   7 screenings with ticket sales — varied occupancy
--   1 SOLD OUT screening with 2 waitlist entries
--   Saja at 8/10 rewards — near a free ticket
--   All clients have payment methods ready to use
--
-- Demo logins:
--   Admin   →  mrboss@smilingfriends.com    /  boss123
--   Client  →  saja2141@gmail.com           /  saja123
--   Client  →  jpine25@uic.edu              /  jordy123
--   Client  →  alpha_charles@email.com      /  charlie123
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- ADMINS
-- ─────────────────────────────────────────────────────────────
INSERT INTO Administrator (email_address, password) VALUES
('mrboss@smilingfriends.com',
 'scrypt:32768:8:1$oNYw6fZuBAuTqvI7$4d3bc5821e3b0aeed44444cc423edff89943bedb7f8c09e2ceda901f952de693dd956425e29708887ef5392743694db8a78d4a796c79449e8cb418d6121b8e00'),
('princessbubblegum@adventuretime.com',
 'scrypt:32768:8:1$4g7RrSY6yARpDRgY$f0973364d42fbfcd7e9c291a22efd39c146de094ca4259d8c5efbf3a7a6efbabcc6b441ab4103809ea73a4165cf92c2113ef0a294c2cdb1bf4759a92925fed96'),
('finn@adventuretime.com',
 'scrypt:32768:8:1$SEgmj8Jrd9evMhjq$bfeb6e992b847848f1b18bbe2d99c8350ab3ad18fc5be81f7aada73ecbf1ab48fdb3dd72f9c3385d0d450eef34cfcb2969067dadf4d1a37858de303860cd4768')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- CLIENTS
-- ─────────────────────────────────────────────────────────────
INSERT INTO Client (email_address, name, address, password, movie_interests, rewards_program) VALUES
('saja2141@gmail.com',
 'Saja', 'Chicago, IL',
 'scrypt:32768:8:1$sDvmdnAjrlQ9C7Pd$1516c6faeb1b4936ab17d6b92d061e0ed86caa23670949255908a3b09811eff954accf0c89111ab41e9a0431964fa96893dd98ecc6d285e60b6fd390a196c1c5',
 'Ghibli, Marvel, dreamy movies', TRUE),

('jpine25@uic.edu',
 'Jordy', '1234 N Clark St, Chicago, IL',
 'scrypt:32768:8:1$EcDPqFqVDPaa0xh9$9d72a8084267d33552e08979ab808dd4ffa7f9d78126dde0d21d4d439562acd6a6731e6c023d4583b1dec4b43c9de8f0dcb70a8ef976167523432f46b1f9d12d',
 'Animation, Sci-fi, Superhero', FALSE),

('alpha_charles@email.com',
 'Charlie', 'Smiling Friends HQ, Chicago',
 'scrypt:32768:8:1$Z7nV0BUricLrsXOq$af74c9ef46cc8c7b9f6dec8ab4ee4fbc48d6f0ac456a054a95e4aed39ae4bb538fbd653d5b631ee4de9e5c59c6978f88e60ba5a5d36da1861b74b4b0aae7ed56',
 'Comedy, Action, Sci-fi', TRUE),

('glepiscool@email.com',
 'Glep', 'Smiling Friends HQ, Chicago',
 'scrypt:32768:8:1$84BVSWkSRocfr7bq$08d5214745267d0859a534f87f64844a5873a4e231094fa4155c904890775e8cf1b8326df4f5322dc2a3d9863b682d72e0faae87672aba29e2463cd3762d98b5',
 'Comedy, Animation', FALSE)
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- PAYMENT METHODS
-- ─────────────────────────────────────────────────────────────
-- Saja: 1 debit + 1 credit
INSERT INTO Paymentmethod (email_address) VALUES ('saja2141@gmail.com');
INSERT INTO Paymentmethod (email_address) VALUES ('saja2141@gmail.com');
-- Jordy: 1 debit
INSERT INTO Paymentmethod (email_address) VALUES ('jpine25@uic.edu');
-- Charlie: 1 credit
INSERT INTO Paymentmethod (email_address) VALUES ('alpha_charles@email.com');
-- Glep: 1 debit
INSERT INTO Paymentmethod (email_address) VALUES ('glepiscool@email.com');

-- Debit cards
INSERT INTO Debitcard (payment_id, card_number)
SELECT payment_id, '4916123456789012' FROM Paymentmethod
WHERE email_address = 'saja2141@gmail.com' ORDER BY payment_id ASC LIMIT 1;

INSERT INTO Debitcard (payment_id, card_number)
SELECT payment_id, '4532015112830366' FROM Paymentmethod
WHERE email_address = 'jpine25@uic.edu' LIMIT 1;

INSERT INTO Debitcard (payment_id, card_number)
SELECT payment_id, '4916338506082832' FROM Paymentmethod
WHERE email_address = 'glepiscool@email.com' LIMIT 1;

-- Credit cards
INSERT INTO Creditcard (payment_id, card_number, billing_address)
SELECT payment_id, '5425233430109903', 'Chicago, IL' FROM Paymentmethod
WHERE email_address = 'saja2141@gmail.com' ORDER BY payment_id DESC LIMIT 1;

INSERT INTO Creditcard (payment_id, card_number, billing_address)
SELECT payment_id, '5425233430100099', 'Smiling Friends HQ' FROM Paymentmethod
WHERE email_address = 'alpha_charles@email.com' LIMIT 1;


-- ─────────────────────────────────────────────────────────────
-- THEATERS
-- ─────────────────────────────────────────────────────────────
INSERT INTO Theater (max_seats, features) VALUES
(110, '3D'),
(95,  'Fancy sound'),
(140, '3D, Fancy sound'),
(70,  'Standard')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- LANGUAGES
-- ─────────────────────────────────────────────────────────────
INSERT INTO Language (language_name) VALUES
('English'), ('Japanese'), ('French'), ('Spanish'), ('Korean')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- MOVIES
-- ─────────────────────────────────────────────────────────────
INSERT INTO Movie (title, release_date, runtime, original_language, major_studio) VALUES
('Howl''s Moving Castle',          '2004-11-20', 119, 'Japanese', TRUE),
('Princess Mononoke',               '1997-07-12', 133, 'Japanese', TRUE),
('My Neighbor Totoro',              '1988-04-16',  86, 'Japanese', TRUE),
('Black Panther',                   '2018-02-16', 134, 'English',  TRUE),
('Spider-Man: No Way Home',         '2021-12-17', 148, 'English',  TRUE),
('Guardians of the Galaxy Vol. 3',  '2023-05-05', 150, 'English',  TRUE),
('The Boy and the Heron',           '2023-07-14', 124, 'Japanese', TRUE),
('Dune: Part Two',                  '2024-03-01', 166, 'English',  TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO MovieLanguage (title, language_name) VALUES
('Howl''s Moving Castle',          'Japanese'),
('Howl''s Moving Castle',          'English'),
('Princess Mononoke',               'Japanese'),
('Princess Mononoke',               'English'),
('My Neighbor Totoro',              'Japanese'),
('My Neighbor Totoro',              'English'),
('Black Panther',                   'English'),
('Black Panther',                   'French'),
('Spider-Man: No Way Home',         'English'),
('Spider-Man: No Way Home',         'Spanish'),
('Guardians of the Galaxy Vol. 3',  'English'),
('The Boy and the Heron',           'Japanese'),
('The Boy and the Heron',           'English'),
('Dune: Part Two',                  'English'),
('Dune: Part Two',                  'French')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- SCREENINGS  (25 total, zero time conflicts)
-- ─────────────────────────────────────────────────────────────
-- Theater 1  →  3D,              110 seats
-- Theater 2  →  Fancy sound,      95 seats
-- Theater 3  →  3D + Fancy sound, 140 seats  ← premium
-- Theater 4  →  Standard,          70 seats
-- screen_id is scoped per theater (auto-incremented booking slot)

INSERT INTO Screening (title, theater_id, screen_id, screening_date, timeslot) VALUES

-- ── June 2026 ────────────────────────────────────────────────
('Dune: Part Two',                  3, 1, '2026-06-15', '20:00:00'),  -- SOLD OUT in sales
('Spider-Man: No Way Home',         1, 1, '2026-06-15', '19:30:00'),  -- 85% full
('Howl''s Moving Castle',           2, 1, '2026-06-15', '17:00:00'),  -- 48% full
('Black Panther',                   3, 2, '2026-06-16', '19:00:00'),  -- 71% full
('My Neighbor Totoro',              4, 1, '2026-06-16', '13:00:00'),  -- 27% full, family matinee
('Princess Mononoke',               2, 2, '2026-06-16', '17:30:00'),  -- 43% full
('The Boy and the Heron',           1, 2, '2026-06-17', '19:00:00'),
('Guardians of the Galaxy Vol. 3',  3, 3, '2026-06-18', '20:00:00'),  -- 16% full
('Howl''s Moving Castle',           4, 2, '2026-06-19', '18:30:00'),
('Dune: Part Two',                  1, 3, '2026-06-20', '20:30:00'),
('Spider-Man: No Way Home',         3, 4, '2026-06-21', '21:00:00'),
('Princess Mononoke',               1, 4, '2026-06-22', '19:30:00'),
('My Neighbor Totoro',              4, 3, '2026-06-22', '14:00:00'),

-- ── July 2026 ────────────────────────────────────────────────
('Black Panther',                   1, 5, '2026-07-04', '20:00:00'),
('The Boy and the Heron',           2, 3, '2026-07-04', '19:00:00'),
('Dune: Part Two',                  2, 4, '2026-07-05', '18:30:00'),
('Guardians of the Galaxy Vol. 3',  1, 6, '2026-07-11', '21:00:00'),
('Princess Mononoke',               3, 5, '2026-07-12', '19:30:00'),
('Howl''s Moving Castle',           2, 5, '2026-07-18', '17:00:00'),
('Dune: Part Two',                  3, 6, '2026-07-19', '20:30:00'),
('Black Panther',                   2, 6, '2026-07-25', '19:00:00'),
('My Neighbor Totoro',              4, 4, '2026-07-26', '15:00:00'),

-- ── August 2026 ──────────────────────────────────────────────
('The Boy and the Heron',           3, 7, '2026-08-01', '20:00:00'),
('Spider-Man: No Way Home',         1, 7, '2026-08-08', '20:00:00'),
('Dune: Part Two',                  3, 8, '2026-08-15', '21:00:00'),
('Howl''s Moving Castle',           1, 8, '2026-08-22', '17:30:00'),
('Princess Mononoke',               4, 5, '2026-08-29', '19:00:00'),

-- ── September 2026 ───────────────────────────────────────────
('Guardians of the Galaxy Vol. 3',  2, 7, '2026-09-05', '20:00:00'),
('Black Panther',                   3, 9, '2026-09-12', '19:30:00'),
('Spider-Man: No Way Home',         2, 8, '2026-09-19', '21:00:00'),
('My Neighbor Totoro',              1, 9, '2026-09-26', '14:00:00'),

-- ── October 2026 ─────────────────────────────────────────────
('Dune: Part Two',                  1, 10, '2026-10-03', '20:00:00'),
('The Boy and the Heron',           2,  9, '2026-10-10', '18:30:00'),
('Howl''s Moving Castle',           3, 10, '2026-10-17', '17:00:00'),
('Princess Mononoke',               4,  6, '2026-10-24', '19:30:00'),
('Guardians of the Galaxy Vol. 3',  3, 11, '2026-10-31', '21:00:00'),

-- ── November 2026 ────────────────────────────────────────────
('Black Panther',                   1, 11, '2026-11-07', '19:00:00'),
('Dune: Part Two',                  2, 10, '2026-11-14', '20:30:00'),
('Spider-Man: No Way Home',         4,  7, '2026-11-21', '20:00:00'),
('My Neighbor Totoro',              3, 12, '2026-11-28', '13:00:00'),

-- ── December 2026 ────────────────────────────────────────────
('The Boy and the Heron',           1, 12, '2026-12-05', '19:30:00'),
('Howl''s Moving Castle',           2, 11, '2026-12-12', '17:00:00'),
('Dune: Part Two',                  3, 13, '2026-12-19', '20:00:00'),
('Princess Mononoke',               4,  8, '2026-12-26', '18:00:00'),
('Guardians of the Galaxy Vol. 3',  1, 13, '2026-12-31', '21:30:00'),

-- ── 2027 ─────────────────────────────────────────────────────
('Black Panther',                   2, 12, '2027-01-10', '19:00:00'),
('Spider-Man: No Way Home',         3, 14, '2027-02-14', '20:00:00'),
('Dune: Part Two',                  1, 14, '2027-03-01', '20:30:00'),
('Howl''s Moving Castle',           4,  9, '2027-04-05', '17:00:00'),
('My Neighbor Totoro',              2, 13, '2027-05-10', '14:00:00'),
('The Boy and the Heron',           3, 15, '2027-06-15', '19:30:00'),
('Princess Mononoke',               1, 15, '2027-07-12', '20:00:00'),
('Guardians of the Galaxy Vol. 3',  4, 10, '2027-08-07', '21:00:00'),
('Black Panther',                   3, 16, '2027-09-06', '19:00:00'),
('Dune: Part Two',                  2, 14, '2027-10-03', '20:00:00'),
('Spider-Man: No Way Home',         1, 16, '2027-11-05', '19:30:00'),
('Howl''s Moving Castle',           3, 17, '2027-12-20', '17:00:00')

ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- TICKET SALES
-- ─────────────────────────────────────────────────────────────
-- Occupancy summary:
--   Dune / T3 / screen 1         140/140  100%  SOLD OUT
--   Spider-Man / T1 / screen 1    93/110   85%  near full
--   Black Panther / T3 / screen 2 100/140  71%  medium-high
--   Howl's / T2 / screen 1        46/95    48%  medium
--   Princess Mononoke / T2/2      41/95    43%  medium
--   My Neighbor Totoro / T4/1     19/70    27%  light
--   Guardians / T3 / screen 3     22/140   16%  light
--
-- Revenue: ~$6,632   Tickets: 461
-- Saja total tickets: 5 + 3 = 8  →  rewards at 8/10


-- Dune Part Two — T3/screen1 — SOLD OUT (140/140) @ $15.60
INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
SELECT pm.payment_id, 80, 15.60,
       'Dune: Part Two', 3, 1, 'alpha_charles@email.com',
       NOW() - INTERVAL '5 days'
FROM   Paymentmethod pm WHERE pm.email_address = 'alpha_charles@email.com' LIMIT 1;

INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
VALUES (NULL, 60, 15.60, 'Dune: Part Two', 3, 1, NULL, NOW() - INTERVAL '3 days');


-- Spider-Man — T1/screen1 — 93/110 (85%) @ $13.80
INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
SELECT pm.payment_id, 55, 13.80,
       'Spider-Man: No Way Home', 1, 1, 'jpine25@uic.edu',
       NOW() - INTERVAL '2 days'
FROM   Paymentmethod pm WHERE pm.email_address = 'jpine25@uic.edu' LIMIT 1;

INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
VALUES (NULL, 38, 13.80, 'Spider-Man: No Way Home', 1, 1, NULL, NOW() - INTERVAL '1 day');


-- Black Panther — T3/screen2 — 100/140 (71%) @ $15.60
-- Saja buys 5  →  starts her toward rewards milestone
INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
SELECT pm.payment_id, 5, 15.60,
       'Black Panther', 3, 2, 'saja2141@gmail.com',
       NOW() - INTERVAL '4 days'
FROM   Paymentmethod pm WHERE pm.email_address = 'saja2141@gmail.com' ORDER BY payment_id ASC LIMIT 1;

INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
VALUES (NULL, 95, 15.60, 'Black Panther', 3, 2, NULL, NOW() - INTERVAL '3 days');


-- Howl's Moving Castle — T2/screen1 — 46/95 (48%) @ $12.60
-- Saja buys 3  →  brings her rewards to 8/10
INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
SELECT pm.payment_id, 3, 12.60,
       'Howl''s Moving Castle', 2, 1, 'saja2141@gmail.com',
       NOW() - INTERVAL '6 days'
FROM   Paymentmethod pm WHERE pm.email_address = 'saja2141@gmail.com' ORDER BY payment_id ASC LIMIT 1;

INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
VALUES (NULL, 43, 12.60, 'Howl''s Moving Castle', 2, 1, NULL, NOW() - INTERVAL '5 days');


-- Princess Mononoke — T2/screen2 — 41/95 (43%) @ $12.60
INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
SELECT pm.payment_id, 20, 12.60,
       'Princess Mononoke', 2, 2, 'glepiscool@email.com',
       NOW() - INTERVAL '3 days'
FROM   Paymentmethod pm WHERE pm.email_address = 'glepiscool@email.com' LIMIT 1;

INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
VALUES (NULL, 21, 12.60, 'Princess Mononoke', 2, 2, NULL, NOW() - INTERVAL '2 days');


-- My Neighbor Totoro — T4/screen1 — 19/70 (27%) @ $10.80
INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
VALUES (NULL, 19, 10.80, 'My Neighbor Totoro', 4, 1, NULL, NOW() - INTERVAL '1 day');


-- Guardians of the Galaxy Vol. 3 — T3/screen3 — 22/140 (16%) @ $15.60
INSERT INTO Ticketsale
  (payment_id, num_sold, price_per_ticket, title, theater_id, screen_id, email_address, sale_timestamp)
VALUES (NULL, 22, 15.60, 'Guardians of the Galaxy Vol. 3', 3, 3, NULL, NOW() - INTERVAL '12 hours');


-- ─────────────────────────────────────────────────────────────
-- WAITLIST
-- ─────────────────────────────────────────────────────────────
-- Dune Part Two (T3/screen1) is sold out.
-- Saja is #1, Jordy is #2 — demos the queue feature immediately.

INSERT INTO Waitlist (email_address, title, theater_id, screen_id, position, status)
VALUES ('saja2141@gmail.com',  'Dune: Part Two', 3, 1, 1, 'waiting')
ON CONFLICT DO NOTHING;

INSERT INTO Waitlist (email_address, title, theater_id, screen_id, position, status)
VALUES ('jpine25@uic.edu', 'Dune: Part Two', 3, 1, 2, 'waiting')
ON CONFLICT DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- PEOPLE
-- ─────────────────────────────────────────────────────────────
INSERT INTO Person (name, birthday, biography) VALUES
('Hayao Miyazaki',
 '1941-01-05',
 'Japanese animator, director, and co-founder of Studio Ghibli. Widely considered one of the greatest filmmakers of all time, Miyazaki''s films are celebrated for their breathtaking hand-drawn animation, ecological themes, and deeply human storytelling. His work has inspired generations of filmmakers worldwide.'),

('Isao Takahata',
 '1935-10-29',
 'Japanese animation director and co-founder of Studio Ghibli alongside Miyazaki. Known for his emotionally devastating and visually grounded films, Takahata brought a quiet realism to animation that set him apart from his contemporaries.'),

('Ryan Coogler',
 '1986-05-23',
 'American filmmaker from Oakland, California. Coogler''s debut Fruitvale Station premiered at Sundance before he went on to direct Creed and Black Panther — the latter becoming a cultural landmark and the first superhero film nominated for the Academy Award for Best Picture.'),

('James Gunn',
 '1966-08-05',
 'American filmmaker and author best known for bringing the Guardians of the Galaxy to life in the MCU. His signature style blends irreverent comedy with surprisingly resonant emotional storytelling. He later became co-head of DC Studios.'),

('Denis Villeneuve',
 '1967-10-03',
 'Canadian director acclaimed for Incendies, Prisoners, Arrival, Blade Runner 2049, and his sprawling two-part adaptation of Dune. Villeneuve is considered a master of slow-burn science fiction, building immersive worlds with patience and visual grandeur.'),

('Chadwick Boseman',
 '1976-11-29',
 'American actor who portrayed T''Challa / Black Panther in the MCU. Boseman continued to work and give career-defining performances while privately battling colon cancer for four years, a fact he never made public. He passed away in 2020 and remains a cultural icon.'),

('Chris Pratt',
 '1979-06-21',
 'American actor best known for playing Peter Quill / Star-Lord across the Guardians of the Galaxy trilogy. His comedic timing and emotional range helped define the tone of the entire series.'),

('Timothée Chalamet',
 '1995-12-27',
 'American-French actor who rose to prominence with Call Me By Your Name and has since established himself as one of his generation''s defining screen presences. His portrayal of Paul Atreides in Dune and Dune: Part Two brought the iconic role to a new generation.')
ON CONFLICT DO NOTHING;

INSERT INTO Directed (name, title) VALUES
('Hayao Miyazaki',   'Howl''s Moving Castle'),
('Hayao Miyazaki',   'Princess Mononoke'),
('Hayao Miyazaki',   'My Neighbor Totoro'),
('Ryan Coogler',     'Black Panther'),
('James Gunn',       'Guardians of the Galaxy Vol. 3'),
('Denis Villeneuve', 'Dune: Part Two'),
('Denis Villeneuve', 'The Boy and the Heron')
ON CONFLICT DO NOTHING;

INSERT INTO Scripted (name, title) VALUES
('Hayao Miyazaki',   'Howl''s Moving Castle'),
('Hayao Miyazaki',   'Princess Mononoke'),
('Ryan Coogler',     'Black Panther'),
('James Gunn',       'Guardians of the Galaxy Vol. 3'),
('Denis Villeneuve', 'Dune: Part Two')
ON CONFLICT DO NOTHING;

INSERT INTO Produced (name, title) VALUES
('Isao Takahata',    'My Neighbor Totoro'),
('Ryan Coogler',     'Black Panther'),
('James Gunn',       'Guardians of the Galaxy Vol. 3')
ON CONFLICT DO NOTHING;

INSERT INTO StarsIn (name, title, character_name) VALUES
('Chadwick Boseman',  'Black Panther',                  'T''Challa / Black Panther'),
('Chris Pratt',       'Guardians of the Galaxy Vol. 3', 'Peter Quill / Star-Lord'),
('Timothée Chalamet', 'Dune: Part Two',                 'Paul Atreides')
ON CONFLICT DO NOTHING;

INSERT INTO Award (award_name, year, role, name, title) VALUES
('Academy Award',  2003, 'director', 'Hayao Miyazaki', 'Howl''s Moving Castle'),
('BAFTA Award',    2019, 'director', 'Ryan Coogler',   'Black Panther'),
('Saturn Award',   2024, 'director', 'James Gunn',     'Guardians of the Galaxy Vol. 3'),
('Critics Choice', 2025, 'director', 'Denis Villeneuve','Dune: Part Two')
ON CONFLICT DO NOTHING;