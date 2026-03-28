const express = require('express');
const cors = require('cors');
const db = require('./db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = "mysecret123";
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // contains userId + role
    next();
  } catch {
    return res.status(401).send("Invalid token");
  }
}

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   GET FLIGHTS (SEARCH)
========================= */
app.get('/api/flights', (req, res) => {
  const source = req.query.source?.trim();
  const destination = req.query.destination?.trim();
  const maxPrice = req.query.maxPrice;

  let conditions = [];
  let values = [];

  if (source) {
    conditions.push('LOWER(source) = LOWER(?)');
    values.push(source);
  }

  if (destination) {
    conditions.push('LOWER(destination) = LOWER(?)');
    values.push(destination);
  }

  if (maxPrice) {
    conditions.push('price <= ?');
    values.push(Number(maxPrice));
  }

  // Only show flights with seats
  conditions.push('available_seats > 0');

  let query = 'SELECT * FROM flights';

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  db.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching flights');
    }
    res.json(result);
  });
});

/* =========================
   BOOK FLIGHT (SAFE)
========================= */
app.post('/api/book', requireAuth, (req, res) => {
  const { flight_id } = req.body;
  const seats = 1; // matches your frontend :contentReference[oaicite:0]{index=0}

  db.getConnection((err, connection) => {
    if (err) return res.status(500).send(err);

    connection.beginTransaction(err => {
      if (err) {
        connection.release();
        return res.status(500).send(err);
      }

      // Step 1: Deduct seats safely
      const updateQuery = `
        UPDATE flights
        SET available_seats = available_seats - ?
        WHERE id = ? AND available_seats >= ?
      `;

      connection.query(updateQuery, [seats, flight_id, seats], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            connection.release();
            res.status(500).send("Error updating seats");
          });
        }

        if (result.affectedRows === 0) {
          return connection.rollback(() => {
            connection.release();
            res.status(400).send("No seats available");
          });
        }

        // Step 2: Insert booking
        const insertQuery = `
          INSERT INTO bookings (flight_id, user_id, seats_booked, status)
          VALUES (?, ?, ?, 'CONFIRMED')
        `;

        connection.query(insertQuery, [flight_id, req.user.userId, seats], (err) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).send("Booking failed");
            });
          }

          // Step 3: Commit
          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                res.status(500).send("Commit failed");
              });
            }

            connection.release();
            res.json({ message: "Booking successful" });
          });
        });
      });
    });
  });
});

/* =========================
   GET BOOKINGS
========================= */
app.get('/api/bookings', requireAuth, (req, res) => {
  const userId = req.user.userId;

  const query = `
    SELECT 
      b.id,
      f.source,
      f.destination,
      f.price,
      b.seats_booked,
      b.booking_time,
      b.status
    FROM bookings b
    JOIN flights f ON b.flight_id = f.id
    WHERE b.user_id = ?
    ORDER BY b.booking_time DESC
  `;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching bookings");
    }

    res.json(result);
  });
});

/* =========================
   MARK COMPLETED
========================= */
app.put('/api/bookings/:id/complete', (req, res) => {
  const bookingId = req.params.id;

  const query = `
    UPDATE bookings
    SET status = 'COMPLETED'
    WHERE id = ?
  `;

  db.query(query, [bookingId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Failed to update booking");
    }

    res.json({ message: "Booking marked as completed" });
  });
});


app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES (?, ?, ?)
    `;

    db.query(query, [name, email, hashedPassword], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Signup failed");
      }

      res.json({ message: "User created successfully" });
    });

  } catch (err) {
    res.status(500).send("Error during signup");
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const query = `SELECT * FROM users WHERE email = ?`;

  db.query(query, [email], async (err, result) => {
    if (err || result.length === 0) {
      return res.status(400).send("User not found");
    }

    const user = result[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).send("Invalid password");
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});