from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import psycopg2
import os
from datetime import date, timedelta, datetime

app = Flask(__name__)
CORS(app)

# ── Opening hours ────────────────────────────────────────────
OPEN_TIME  = datetime.strptime("10:00", "%H:%M").time()
CLOSE_TIME = datetime.strptime("23:59", "%H:%M").time()


# ── DB connection ─────────────────────────────────────────────
# Reads from environment variables when running in Docker.
# Falls back to localhost defaults for local development.
def db():
    return psycopg2.connect(
        host     = os.getenv("DB_HOST",     "localhost"),
        port     = os.getenv("DB_PORT",     "5433"),
        dbname   = os.getenv("DB_NAME",     "cinema"),
        user     = os.getenv("DB_USER",     "postgres"),
        password = os.getenv("DB_PASSWORD", "postgres"),
    )


# ── Ticket price calculator ───────────────────────────────────
def ticketprice(threed, sound, studio, releasedate):
    price = 15.00
    if threed:  price += 5.00
    if sound:   price += 3.00
    if studio:  price += 3.00
    today = date.today()
    if releasedate <= today - timedelta(days=730):
        price *= 0.60
    elif releasedate <= today - timedelta(days=60):
        price *= 0.80
    return round(price, 2)


# ── Screening serialiser (shared by GET /screenings routes) ──
def serialize_screening(row, cols):
    d = dict(zip(cols, row))
    d["price"]          = ticketprice(d["is_3d"], d["has_sound"], d["major_studio"], d["release_date"])
    d["screening_date"] = str(d["screening_date"])
    d["release_date"]   = str(d["release_date"])
    d["timeslot"]       = str(d["timeslot"])
    return d


# ════════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════════

# Single login endpoint — detects role automatically
@app.route("/login", methods=["POST"])
def login():
    data     = request.get_json()
    email    = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = db()
    cur  = conn.cursor()

    # check client first
    cur.execute("SELECT name, email_address, password FROM Client WHERE email_address = %s", (email,))
    client = cur.fetchone()
    if client and check_password_hash(client[2], password):
        cur.close(); conn.close()
        return jsonify({"name": client[0], "email": client[1], "role": "client"})

    # check admin
    cur.execute("SELECT email_address, password FROM Administrator WHERE email_address = %s", (email,))
    admin = cur.fetchone()
    if admin and check_password_hash(admin[1], password):
        cur.close(); conn.close()
        return jsonify({"name": "Admin", "email": admin[0], "role": "admin"})

    cur.close(); conn.close()
    return jsonify({"error": "Invalid email or password"}), 401


# Register a new client
@app.route("/register", methods=["POST"])
def register():
    data     = request.get_json()
    email    = data.get("email", "").strip().lower()
    name     = data.get("name", "").strip()
    address  = data.get("address", "").strip()
    password = data.get("password", "")
    interests= data.get("interests", "")
    rewards  = data.get("rewards", False)

    if not all([email, name, address, password]):
        return jsonify({"error": "All fields are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    hashed = generate_password_hash(password)

    conn = db(); cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO Client (email_address, name, address, password, movie_interests, rewards_program) VALUES (%s,%s,%s,%s,%s,%s)",
            (email, name, address, hashed, interests, rewards)
        )
        conn.commit()
        return jsonify({"message": "Account created!", "name": name, "email": email, "role": "client"}), 201
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "An account with this email already exists"}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


# ════════════════════════════════════════════════════════════════
# MOVIES
# ════════════════════════════════════════════════════════════════

@app.route("/movies", methods=["GET"])
def getmovies():
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT m.title, m.release_date, m.runtime, m.original_language, m.major_studio,
               COALESCE(array_agg(DISTINCT ml.language_name) FILTER (WHERE ml.language_name IS NOT NULL), '{}') AS languages,
               COALESCE(array_agg(DISTINCT d.name)           FILTER (WHERE d.name IS NOT NULL), '{}')          AS directors,
               COALESCE(array_agg(DISTINCT s.name)           FILTER (WHERE s.name IS NOT NULL), '{}')          AS writers,
               COALESCE(array_agg(DISTINCT p.name)           FILTER (WHERE p.name IS NOT NULL), '{}')          AS producers,
               COALESCE(
                   json_agg(DISTINCT jsonb_build_object('name', si.name, 'character', si.character_name))
                   FILTER (WHERE si.name IS NOT NULL), '[]'
               ) AS actors
        FROM   Movie m
        LEFT JOIN MovieLanguage ml ON ml.title = m.title
        LEFT JOIN Directed      d  ON d.title  = m.title
        LEFT JOIN Scripted      s  ON s.title  = m.title
        LEFT JOIN Produced      p  ON p.title  = m.title
        LEFT JOIN StarsIn       si ON si.title = m.title
        GROUP BY m.title, m.release_date, m.runtime, m.original_language, m.major_studio
        ORDER BY m.release_date DESC;
    """)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    results = []
    for row in rows:
        d = dict(zip(cols, row))
        d["release_date"] = str(d["release_date"])
        results.append(d)
    cur.close(); conn.close()
    return jsonify(results)


@app.route("/movies/search", methods=["GET"])
def searchmovies():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify([])
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT title, release_date, runtime, original_language, major_studio
        FROM   Movie
        WHERE  LOWER(title) LIKE LOWER(%s)
        ORDER  BY title
        LIMIT  10;
    """, (f"%{q}%",))
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    results = [dict(zip(cols, r)) for r in rows]
    for r in results:
        r["release_date"] = str(r["release_date"])
    cur.close(); conn.close()
    return jsonify(results)


# ════════════════════════════════════════════════════════════════
# THEATERS
# ════════════════════════════════════════════════════════════════

@app.route("/theaters", methods=["GET"])
def gettheaters():
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT theater_id, max_seats, features,
               features LIKE '%%3D%%'          AS is_3d,
               features LIKE '%%Fancy sound%%' AS has_sound
        FROM   Theater ORDER BY theater_id;
    """)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return jsonify([dict(zip(cols, r)) for r in rows])


# ════════════════════════════════════════════════════════════════
# SCREENINGS
# ════════════════════════════════════════════════════════════════

SCREENING_BASE = """
    SELECT s.screen_id, s.title, s.theater_id, s.screening_date, s.timeslot,
           m.runtime, m.major_studio, m.release_date, m.original_language,
           t.max_seats, t.features,
           t.features LIKE '%%3D%%'          AS is_3d,
           t.features LIKE '%%Fancy sound%%' AS has_sound,
           COALESCE(SUM(ts.num_sold), 0)                            AS tickets_sold,
           t.max_seats - COALESCE(SUM(ts.num_sold), 0)             AS available_seats
    FROM   Screening s
    JOIN   Movie   m ON m.title      = s.title
    JOIN   Theater t ON t.theater_id = s.theater_id
    LEFT JOIN Ticketsale ts
           ON ts.title = s.title AND ts.theater_id = s.theater_id AND ts.screen_id = s.screen_id
    WHERE  s.screening_date >= CURRENT_DATE
"""

@app.route("/screenings", methods=["GET"])
def getscreenings():
    conn = db(); cur = conn.cursor()
    cur.execute(SCREENING_BASE + """
        GROUP BY s.screen_id, s.title, s.theater_id, s.screening_date, s.timeslot,
                 m.runtime, m.major_studio, m.release_date, m.original_language,
                 t.max_seats, t.features
        ORDER BY s.screening_date, s.timeslot;
    """)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return jsonify([serialize_screening(r, cols) for r in rows])


@app.route("/screenings/search", methods=["GET"])
def searchscreenings():
    title      = request.args.get("title", "").strip()
    s_date     = request.args.get("date", "").strip()
    time_after = request.args.get("time_after", "").strip()

    query  = SCREENING_BASE
    params = []
    if title:      query += " AND LOWER(s.title) LIKE LOWER(%s)"; params.append(f"%{title}%")
    if s_date:     query += " AND s.screening_date = %s";         params.append(s_date)
    if time_after: query += " AND s.timeslot >= %s";              params.append(time_after)

    query += """
        GROUP BY s.screen_id, s.title, s.theater_id, s.screening_date, s.timeslot,
                 m.runtime, m.major_studio, m.release_date, m.original_language,
                 t.max_seats, t.features
        ORDER BY s.screening_date, s.timeslot;
    """
    conn = db(); cur = conn.cursor()
    cur.execute(query, params)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    return jsonify([serialize_screening(r, cols) for r in rows])


# ════════════════════════════════════════════════════════════════
# TICKETS
# ════════════════════════════════════════════════════════════════

@app.route("/tickets", methods=["GET"])
def gettickets():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "email required"}), 400
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT ts.order_id, ts.title, ts.theater_id, ts.screen_id,
               ts.num_sold, ts.price_per_ticket,
               ROUND(ts.num_sold * ts.price_per_ticket, 2) AS total_price,
               ts.sale_timestamp,
               s.screening_date, s.timeslot
        FROM   Ticketsale ts
        LEFT JOIN Screening s
               ON s.title = ts.title AND s.theater_id = ts.theater_id AND s.screen_id = ts.screen_id
        WHERE  ts.email_address = %s
        ORDER  BY ts.sale_timestamp DESC;
    """, (email,))
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    results = []
    for r in rows:
        d = dict(zip(cols, r))
        d["sale_timestamp"]  = str(d["sale_timestamp"])
        d["screening_date"]  = str(d["screening_date"]) if d["screening_date"] else None
        d["timeslot"]        = str(d["timeslot"]) if d["timeslot"] else None
        d["price_per_ticket"]= float(d["price_per_ticket"]) if d["price_per_ticket"] else None
        d["total_price"]     = float(d["total_price"]) if d["total_price"] else None
        results.append(d)
    cur.close(); conn.close()
    return jsonify(results)


@app.route("/tickets", methods=["POST"])
def buytickets():
    data        = request.get_json()
    title       = data.get("title")
    theater_id  = data.get("theater_id")
    screen_id   = data.get("screen_id")
    num_tickets = data.get("num_tickets")
    payment_id  = data.get("payment_id")
    email_addr  = data.get("email_address")

    if not all([title, theater_id, screen_id, num_tickets]):
        return jsonify({"error": "Missing required fields"}), 400
    if not isinstance(num_tickets, int) or num_tickets <= 0:
        return jsonify({"error": "num_tickets must be a positive integer"}), 400

    conn = db(); cur = conn.cursor()
    try:
        # Lock row to prevent race condition / overbooking
        cur.execute("""
            SELECT title FROM Screening
            WHERE title = %s AND theater_id = %s AND screen_id = %s
            FOR UPDATE;
        """, (title, theater_id, screen_id))
        if not cur.fetchone():
            return jsonify({"error": "Screening not found"}), 404

        # Count seats sold (separate query — FOR UPDATE disallows GROUP BY)
        cur.execute("""
            SELECT t.max_seats, COALESCE(SUM(ts.num_sold), 0) AS sold
            FROM   Theater t
            LEFT JOIN Ticketsale ts
                   ON ts.theater_id = t.theater_id AND ts.title = %s AND ts.screen_id = %s
            WHERE  t.theater_id = %s
            GROUP  BY t.max_seats;
        """, (title, screen_id, theater_id))
        row = cur.fetchone()
        if not row:
            return jsonify({"error": "Theater not found"}), 404

        max_seats, sold = row
        available = int(max_seats) - int(sold)
        if num_tickets > available:
            return jsonify({"error": f"Only {available} seat(s) left for this screening."}), 409

        # Calculate price
        cur.execute("""
            SELECT m.major_studio, m.release_date,
                   t.features LIKE '%%3D%%'          AS is_3d,
                   t.features LIKE '%%Fancy sound%%' AS has_sound
            FROM   Movie m JOIN Theater t ON t.theater_id = %s
            WHERE  m.title = %s;
        """, (theater_id, title))
        info = cur.fetchone()
        if not info:
            return jsonify({"error": "Movie or theater info not found"}), 404

        price = ticketprice(info[2], info[3], info[0], info[1])

        # Insert sale
        cur.execute("""
            INSERT INTO Ticketsale
                (payment_id, num_sold, title, theater_id, screen_id, email_address, price_per_ticket, sale_timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING order_id;
        """, (payment_id, num_tickets, title, theater_id, screen_id, email_addr, price))
        order_id = cur.fetchone()[0]

        # If screening now sold out, notify waitlist
        new_sold = sold + num_tickets
        if new_sold >= max_seats:
            cur.execute("""
                UPDATE Waitlist SET status = 'notified'
                WHERE  title = %s AND theater_id = %s AND screen_id = %s AND status = 'waiting';
            """, (title, theater_id, screen_id))

        conn.commit()
        return jsonify({
            "message": "Tickets booked!",
            "order_id": order_id,
            "num_tickets": num_tickets,
            "price_per_ticket": price,
            "total_price": round(price * num_tickets, 2)
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


# ════════════════════════════════════════════════════════════════
# PAYMENTS
# ════════════════════════════════════════════════════════════════

@app.route("/clients/<email>/payments", methods=["GET"])
def getclientpayments(email):
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT pm.payment_id,
               CASE WHEN c.payment_id IS NOT NULL THEN 'credit' ELSE 'debit' END AS payment_type,
               COALESCE(c.card_number, d.card_number) AS card_number,
               c.billing_address
        FROM   Paymentmethod pm
        LEFT JOIN Creditcard c ON pm.payment_id = c.payment_id
        LEFT JOIN Debitcard  d ON pm.payment_id = d.payment_id
        WHERE  pm.email_address = %s
        ORDER  BY pm.payment_id;
    """, (email,))
    rows = cur.fetchall()
    payments = [{"payment_id": r[0], "type": r[1], "card_number": r[2], "billing_address": r[3]} for r in rows]
    cur.close(); conn.close()
    return jsonify(payments)


@app.route("/clients/<email>/payments/credit", methods=["POST"])
def addcredit(email):
    data    = request.get_json()
    card_no = data.get("card_number")
    billing = data.get("billing_address")
    if not card_no or not billing:
        return jsonify({"error": "Card number and billing address required"}), 400
    conn = db(); cur = conn.cursor()
    try:
        cur.execute("INSERT INTO Paymentmethod (email_address) VALUES (%s) RETURNING payment_id;", (email,))
        pid = cur.fetchone()[0]
        cur.execute("INSERT INTO Creditcard (payment_id, card_number, billing_address) VALUES (%s, %s, %s);", (pid, card_no, billing))
        conn.commit()
        return jsonify({"message": "Credit card added", "payment_id": pid}), 201
    except Exception as e:
        conn.rollback(); return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


@app.route("/clients/<email>/payments/debit", methods=["POST"])
def adddebit(email):
    data    = request.get_json()
    card_no = data.get("card_number")
    if not card_no:
        return jsonify({"error": "Card number required"}), 400
    conn = db(); cur = conn.cursor()
    try:
        cur.execute("INSERT INTO Paymentmethod (email_address) VALUES (%s) RETURNING payment_id;", (email,))
        pid = cur.fetchone()[0]
        cur.execute("INSERT INTO Debitcard (payment_id, card_number) VALUES (%s, %s);", (pid, card_no))
        conn.commit()
        return jsonify({"message": "Debit card added", "payment_id": pid}), 201
    except Exception as e:
        conn.rollback(); return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


@app.route("/payments/<int:payment_id>", methods=["DELETE"])
def deletepayment(payment_id):
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "email required"}), 400
    conn = db(); cur = conn.cursor()
    try:
        cur.execute("DELETE FROM Paymentmethod WHERE payment_id = %s AND email_address = %s RETURNING payment_id;", (payment_id, email))
        if not cur.fetchone():
            return jsonify({"error": "Payment method not found"}), 404
        conn.commit()
        return jsonify({"message": "Deleted"})
    except Exception as e:
        conn.rollback(); return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


# ════════════════════════════════════════════════════════════════
# REWARDS
# ════════════════════════════════════════════════════════════════

@app.route("/clients/<email>/rewards", methods=["GET"])
def getrewards(email):
    conn = db(); cur = conn.cursor()
    cur.execute("SELECT rewards_program FROM Client WHERE email_address = %s;", (email,))
    row = cur.fetchone()
    if not row:
        return jsonify({"error": "Client not found"}), 404

    cur.execute("SELECT COALESCE(SUM(num_sold), 0) FROM Ticketsale WHERE email_address = %s;", (email,))
    total = int(cur.fetchone()[0])
    cur.close(); conn.close()

    free_earned   = total // 10
    progress      = total % 10
    return jsonify({
        "enrolled":     row[0],
        "total_tickets": total,
        "free_earned":  free_earned,
        "progress":     progress,       # tickets toward next free one
        "next_free_at": 10 - progress   # tickets still needed
    })


# ════════════════════════════════════════════════════════════════
# PERSONS (Stars page)
# ════════════════════════════════════════════════════════════════

@app.route("/persons", methods=["GET"])
def getpersons():
    conn = db(); cur = conn.cursor()
    cur.execute("SELECT name, birthday FROM Person ORDER BY name;")
    rows = cur.fetchall()
    result = [{"name": r[0], "birthday": str(r[1])} for r in rows]
    cur.close(); conn.close()
    return jsonify(result)


@app.route("/persons/<path:name>", methods=["GET"])
def getperson(name):
    conn = db(); cur = conn.cursor()
    cur.execute("SELECT name, birthday, biography FROM Person WHERE name = %s;", (name,))
    p = cur.fetchone()
    if not p:
        return jsonify({"error": "Person not found"}), 404

    cur.execute("SELECT title FROM Directed  WHERE name = %s;", (name,))
    directed = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT title FROM Scripted  WHERE name = %s;", (name,))
    written  = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT title FROM Produced  WHERE name = %s;", (name,))
    produced = [r[0] for r in cur.fetchall()]

    cur.execute("SELECT title, character_name FROM StarsIn WHERE name = %s;", (name,))
    acted_in = [{"title": r[0], "character": r[1]} for r in cur.fetchall()]

    cur.execute("SELECT award_name, year, role, title FROM Award WHERE name = %s ORDER BY year DESC;", (name,))
    awards = [{"award": r[0], "year": r[1], "role": r[2], "title": r[3]} for r in cur.fetchall()]

    cur.close(); conn.close()
    return jsonify({
        "name":      p[0], "birthday": str(p[1]), "biography": p[2],
        "directed":  directed, "written": written, "produced": produced,
        "acted_in":  acted_in, "awards":  awards
    })


# ════════════════════════════════════════════════════════════════
# ADMIN — SCREENINGS
# ════════════════════════════════════════════════════════════════

@app.route("/admin/screenings", methods=["POST"])
def createscreening():
    data           = request.get_json()
    title          = data.get("title")
    theater_id     = data.get("theater_id")
    screening_date = data.get("screening_date")
    timeslot       = data.get("timeslot")

    if not all([title, theater_id, screening_date, timeslot]):
        return jsonify({"error": "Missing required fields"}), 400

    if len(timeslot) == 5:
        timeslot += ":00"

    try:
        t_check = datetime.strptime(timeslot, "%H:%M:%S").time()
    except ValueError:
        return jsonify({"error": "Invalid timeslot format"}), 400

    if t_check < OPEN_TIME or t_check > CLOSE_TIME:
        return jsonify({"error": f"Screenings must be between {OPEN_TIME.strftime('%H:%M')} and {CLOSE_TIME.strftime('%H:%M')}"}), 400

    conn = db(); cur = conn.cursor()
    try:
        cur.execute("SELECT runtime FROM Movie WHERE title = %s;", (title,))
        movie_row = cur.fetchone()
        if not movie_row:
            return jsonify({"error": f"Movie '{title}' not found"}), 404
        new_runtime = movie_row[0]

        cur.execute("SELECT theater_id FROM Theater WHERE theater_id = %s;", (theater_id,))
        if not cur.fetchone():
            return jsonify({"error": f"Theater {theater_id} not found"}), 404

        # Overlap check
        cur.execute("""
            SELECT s.timeslot, m.runtime FROM Screening s
            JOIN Movie m ON m.title = s.title
            WHERE s.theater_id = %s AND s.screening_date = %s;
        """, (theater_id, screening_date))

        new_start = datetime.strptime(f"{screening_date} {timeslot}", "%Y-%m-%d %H:%M:%S")
        new_end   = new_start + timedelta(minutes=new_runtime + 30)

        for (exist_ts, exist_rt) in cur.fetchall():
            if hasattr(exist_ts, 'seconds'):
                h, rem = divmod(exist_ts.seconds, 3600)
                m, s   = divmod(rem, 60)
                exist_str = f"{h:02d}:{m:02d}:{s:02d}"
            else:
                exist_str = str(exist_ts)
            exist_start = datetime.strptime(f"{screening_date} {exist_str}", "%Y-%m-%d %H:%M:%S")
            exist_end   = exist_start + timedelta(minutes=exist_rt + 30)
            if not (new_end <= exist_start or new_start >= exist_end):
                return jsonify({"error": f"Theater {theater_id} is already booked around {exist_str} on {screening_date}"}), 409

        cur.execute("SELECT COALESCE(MAX(screen_id), 0) + 1 FROM Screening WHERE theater_id = %s;", (theater_id,))
        next_sid = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO Screening (title, theater_id, screen_id, screening_date, timeslot)
            VALUES (%s, %s, %s, %s, %s) RETURNING screen_id;
        """, (title, theater_id, next_sid, screening_date, timeslot))
        screen_id = cur.fetchone()[0]

        # Notify waitlisted users for this movie (new screening added!)
        cur.execute("""
            UPDATE Waitlist SET status = 'notified'
            WHERE  title = %s AND status = 'waiting';
        """, (title,))

        conn.commit()
        return jsonify({
            "message": "Screening scheduled!", "screen_id": screen_id,
            "title": title, "theater_id": theater_id,
            "screening_date": screening_date, "timeslot": timeslot
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


@app.route("/admin/screenings/capacity", methods=["GET"])
def getcapacity():
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT s.screen_id, s.title, s.theater_id, s.screening_date, s.timeslot,
               t.max_seats,
               COALESCE(SUM(ts.num_sold), 0)                              AS tickets_sold,
               t.max_seats - COALESCE(SUM(ts.num_sold), 0)               AS available_seats,
               ROUND(COALESCE(SUM(ts.num_sold), 0) * 100.0 / t.max_seats, 1) AS occupancy_pct
        FROM   Screening s
        JOIN   Theater t ON t.theater_id = s.theater_id
        LEFT JOIN Ticketsale ts
               ON ts.title = s.title AND ts.theater_id = s.theater_id AND ts.screen_id = s.screen_id
        GROUP  BY s.screen_id, s.title, s.theater_id, s.screening_date, s.timeslot, t.max_seats
        ORDER  BY s.screening_date, s.timeslot;
    """)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    results = []
    for r in rows:
        d = dict(zip(cols, r))
        d["screening_date"] = str(d["screening_date"])
        d["timeslot"]       = str(d["timeslot"])
        d["occupancy_pct"]  = float(d["occupancy_pct"] or 0)
        results.append(d)
    cur.close(); conn.close()
    return jsonify(results)


# ════════════════════════════════════════════════════════════════
# ADMIN — ANALYTICS / REPORTS
# ════════════════════════════════════════════════════════════════

@app.route("/admin/analytics", methods=["GET"])
def getanalytics():
    conn = db(); cur = conn.cursor()

    cur.execute("""
        SELECT ts.title,
               SUM(ts.num_sold)                           AS total_tickets,
               SUM(ts.num_sold * ts.price_per_ticket)     AS total_revenue,
               ROUND(AVG(ts.price_per_ticket), 2)         AS avg_price
        FROM   Ticketsale ts WHERE ts.price_per_ticket IS NOT NULL
        GROUP  BY ts.title ORDER BY total_revenue DESC NULLS LAST;
    """)
    by_movie = [{k: (float(v) if hasattr(v, '__round__') else v)
                 for k, v in zip([d[0] for d in cur.description], r)}
                for r in cur.fetchall()]

    cur.execute("""
        SELECT ts.theater_id,
               SUM(ts.num_sold)                           AS total_tickets,
               SUM(ts.num_sold * ts.price_per_ticket)     AS total_revenue,
               ROUND(AVG(ts.price_per_ticket), 2)         AS avg_price
        FROM   Ticketsale ts WHERE ts.price_per_ticket IS NOT NULL
        GROUP  BY ts.theater_id ORDER BY ts.theater_id;
    """)
    by_theater = [{k: (float(v) if hasattr(v, '__round__') else v)
                   for k, v in zip([d[0] for d in cur.description], r)}
                  for r in cur.fetchall()]

    cur.execute("""
        SELECT COUNT(*) AS total_sales,
               COALESCE(SUM(num_sold), 0)                 AS total_tickets,
               COALESCE(SUM(num_sold * price_per_ticket), 0) AS total_revenue
        FROM   Ticketsale WHERE price_per_ticket IS NOT NULL;
    """)
    r = cur.fetchone()
    totals = {"total_sales": int(r[0]), "total_tickets": int(r[1]), "total_revenue": float(r[2])}

    cur.close(); conn.close()
    return jsonify({"totals": totals, "by_movie": by_movie, "by_theater": by_theater})


@app.route("/admin/reports/revenue", methods=["GET"])
def revenuereport():
    return getanalytics()


@app.route("/admin/reports/occupancy", methods=["GET"])
def occupancyreport():
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT s.title, s.theater_id, s.screen_id,
               s.screening_date, s.timeslot, t.max_seats,
               COALESCE(SUM(ts.num_sold), 0) AS tickets_sold,
               t.max_seats - COALESCE(SUM(ts.num_sold), 0) AS seats_remaining,
               ROUND(COALESCE(SUM(ts.num_sold), 0) * 100.0 / t.max_seats, 1) AS occupancy_pct
        FROM   Screening s
        JOIN   Theater t ON t.theater_id = s.theater_id
        LEFT JOIN Ticketsale ts
               ON ts.title = s.title AND ts.theater_id = s.theater_id AND ts.screen_id = s.screen_id
        GROUP  BY s.title, s.theater_id, s.screen_id, s.screening_date, s.timeslot, t.max_seats
        ORDER  BY s.screening_date, s.timeslot;
    """)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    results = []
    for r in rows:
        d = dict(zip(cols, r))
        d["screening_date"] = str(d["screening_date"])
        d["timeslot"]       = str(d["timeslot"])
        d["occupancy_pct"]  = float(d["occupancy_pct"] or 0)
        results.append(d)
    cur.close(); conn.close()
    return jsonify(results)


@app.route("/admin/reports/occupancy/summary", methods=["GET"])
def occupancysummary():
    theater_id = request.args.get("theater_id")
    from_date  = request.args.get("from")
    to_date    = request.args.get("to")

    query  = """
        SELECT ROUND(AVG(COALESCE(sub.sold,0) * 100.0 / t.max_seats), 1) AS avg_occupancy_pct,
               ROUND(MIN(COALESCE(sub.sold,0) * 100.0 / t.max_seats), 1) AS min_occupancy_pct,
               ROUND(MAX(COALESCE(sub.sold,0) * 100.0 / t.max_seats), 1) AS max_occupancy_pct,
               COUNT(*) AS total_screenings
        FROM   Screening s
        JOIN   Theater t ON t.theater_id = s.theater_id
        LEFT JOIN (
            SELECT title, theater_id, screen_id, SUM(num_sold) AS sold
            FROM   Ticketsale GROUP BY title, theater_id, screen_id
        ) sub ON sub.title = s.title AND sub.theater_id = s.theater_id AND sub.screen_id = s.screen_id
        WHERE  1=1
    """
    params = []
    if theater_id: query += " AND s.theater_id = %s"; params.append(theater_id)
    if from_date:  query += " AND s.screening_date >= %s"; params.append(from_date)
    if to_date:    query += " AND s.screening_date <= %s"; params.append(to_date)

    conn = db(); cur = conn.cursor()
    cur.execute(query, params)
    r = cur.fetchone()
    cols = [d[0] for d in cur.description]
    cur.close(); conn.close()
    result = dict(zip(cols, r))
    for k in result:
        if result[k] is not None and hasattr(result[k], '__round__'):
            result[k] = float(result[k])
    return jsonify(result)


# ════════════════════════════════════════════════════════════════
# WAITLIST  ← the special feature
# ════════════════════════════════════════════════════════════════

@app.route("/waitlist", methods=["POST"])
def joinwaitlist():
    data       = request.get_json()
    email      = data.get("email_address")
    title      = data.get("title")
    theater_id = data.get("theater_id")
    screen_id  = data.get("screen_id")

    if not all([email, title, theater_id, screen_id]):
        return jsonify({"error": "Missing required fields"}), 400

    conn = db(); cur = conn.cursor()
    try:
        # Get next position
        cur.execute("""
            SELECT COALESCE(MAX(position), 0) + 1 FROM Waitlist
            WHERE title = %s AND theater_id = %s AND screen_id = %s AND status = 'waiting';
        """, (title, theater_id, screen_id))
        position = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO Waitlist (email_address, title, theater_id, screen_id, position, status)
            VALUES (%s, %s, %s, %s, %s, 'waiting')
            RETURNING waitlist_id;
        """, (email, title, theater_id, screen_id, position))
        wid = cur.fetchone()[0]
        conn.commit()
        return jsonify({"message": "You're on the waitlist!", "waitlist_id": wid, "position": position}), 201
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        return jsonify({"error": "You are already on the waitlist for this screening"}), 409
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


@app.route("/waitlist", methods=["GET"])
def getwaitlist():
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "email required"}), 400
    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT w.waitlist_id, w.title, w.theater_id, w.screen_id,
               w.position, w.status, w.joined_at,
               s.screening_date, s.timeslot
        FROM   Waitlist w
        LEFT JOIN Screening s
               ON s.title = w.title AND s.theater_id = w.theater_id AND s.screen_id = w.screen_id
        WHERE  w.email_address = %s AND w.status != 'cancelled'
        ORDER  BY w.joined_at DESC;
    """, (email,))
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description]
    results = []
    for r in rows:
        d = dict(zip(cols, r))
        d["joined_at"]      = str(d["joined_at"])
        d["screening_date"] = str(d["screening_date"]) if d["screening_date"] else None
        d["timeslot"]       = str(d["timeslot"]) if d["timeslot"] else None
        results.append(d)
    cur.close(); conn.close()
    return jsonify(results)


@app.route("/waitlist/<int:waitlist_id>", methods=["DELETE"])
def leavewaitlist(waitlist_id):
    email = request.args.get("email")
    if not email:
        return jsonify({"error": "email required"}), 400
    conn = db(); cur = conn.cursor()
    try:
        cur.execute("""
            UPDATE Waitlist SET status = 'cancelled'
            WHERE  waitlist_id = %s AND email_address = %s
            RETURNING waitlist_id;
        """, (waitlist_id, email))
        if not cur.fetchone():
            return jsonify({"error": "Waitlist entry not found"}), 404
        conn.commit()
        return jsonify({"message": "Removed from waitlist"})
    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 400
    finally:
        cur.close(); conn.close()


@app.route("/waitlist/position", methods=["GET"])
def waitlistposition():
    email      = request.args.get("email")
    title      = request.args.get("title")
    theater_id = request.args.get("theater_id")
    screen_id  = request.args.get("screen_id")

    conn = db(); cur = conn.cursor()
    cur.execute("""
        SELECT position, status,
               (SELECT COUNT(*) FROM Waitlist
                WHERE title = %s AND theater_id = %s AND screen_id = %s AND status = 'waiting') AS total_waiting
        FROM   Waitlist
        WHERE  email_address = %s AND title = %s AND theater_id = %s AND screen_id = %s;
    """, (title, theater_id, screen_id, email, title, theater_id, screen_id))
    row = cur.fetchone()
    cur.close(); conn.close()
    if not row:
        return jsonify({"on_waitlist": False})
    return jsonify({"on_waitlist": True, "position": row[0], "status": row[1], "total_waiting": int(row[2])})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)