const express = require('express');
const cors = require('cors');
const db = require('./db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

let transporter = null;
nodemailer.createTestAccount((err, account) => {
  if (!err) {
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: {
        user: account.user,
        pass: account.pass
      }
    });
    console.log("Mail Transporter Ready");
  } else {
    console.error("Failed to generate test mail account:", err);
  }
});

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

            // Send Confirmation Email Asynchronously
            if (transporter) {
              db.query("SELECT email, name FROM users WHERE id = ?", [req.user.userId], (err, users) => {
                if (!err && users.length > 0) {
                  const user = users[0];
                  db.query("SELECT flight_number, source, destination, departure_time FROM flights WHERE id = ?", [flight_id], (err, flights) => {
                    if (!err && flights.length > 0) {
                      const flight = flights[0];
                      const mailOptions = {
                        from: '"Udan Khatola" <bookings@udankhatola.com>',
                        to: user.email,
                        subject: `Booking Confirmed: ${flight.flight_number}`,
                        text: `Hello ${user.name},\n\nYour flight ${flight.flight_number} from ${flight.source} to ${flight.destination} on ${new Date(flight.departure_time).toLocaleString()} has been successfully confirmed!\n\nSafe travels!`,
                      };

                      transporter.sendMail(mailOptions, (err, info) => {
                        if (!err) {
                          console.log("------------------------");
                          console.log("EMAIL SENT!");
                          console.log("Preview URL: " + nodemailer.getTestMessageUrl(info));
                          console.log("------------------------");
                        }
                      });
                    }
                  });
                }
              });
            }

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
app.put('/api/bookings/:id/complete', requireAuth, (req, res) => {
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

/* =========================
   CANCEL BOOKING (PL/SQL SP)
========================= */
app.put('/api/bookings/:id/cancel', requireAuth, (req, res) => {
  const bookingId = req.params.id;

  const query = `CALL sp_cancel_booking(?)`;

  db.query(query, [bookingId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Failed to cancel booking" });
    }

    // SP returns a result set with the message
    res.json(results[0][0]);
  });
});

/* =========================
   ANALYTICS - REVENUE (PL/SQL SP with Cursor)
========================= */
app.get('/api/analytics/revenue', (req, res) => {
  const query = `CALL sp_revenue_report()`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching revenue report");
    }
    res.json(results[0]); // MySQL drivers return results[0] for first result set of SP
  });
});

/* =========================
   ANALYTICS - USER SUMMARY (PL/SQL SP with Cursor)
========================= */
app.get('/api/analytics/user-summary', requireAuth, (req, res) => {
  const userId = req.user.userId;
  const query = `CALL sp_user_booking_summary(?)`;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching user summary");
    }
    // SP returns two result sets: [0] overall summary, [1] route frequency
    res.json({
      summary: results[0][0],
      routeFrequency: results[1]
    });
  });
});

/* =========================
   ADMIN - BULK PRICE UPDATE (PL/SQL SP with Cursor)
========================= */
app.post('/api/admin/bulk-price-update', (req, res) => {
  const { source, destination, percentage } = req.body;
  
  if (!source || !destination || percentage === undefined) {
    return res.status(400).send("Missing parameters");
  }

  const query = `CALL sp_bulk_price_update(?, ?, ?)`;

  db.query(query, [source, destination, percentage], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    
    // returns updated count & detailed list
    res.json({
      summary: results[0][0],
      updates: results[1]
    });
  });
});

/* =========================
   ADMIN - AUDIT LOG (Triggers)
========================= */
app.get('/api/admin/audit-log', (req, res) => {
  const query = `SELECT * FROM booking_audit_log ORDER BY created_at DESC LIMIT 100`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching audit log");
    }
    res.json(results);
  });
});

/* =========================
   ADMIN - INDEXES
========================= */
app.get('/api/admin/indexes', (req, res) => {
  const query = `
    SELECT TABLE_NAME as tableName, INDEX_NAME as indexName, COLUMN_NAME as columnName, NON_UNIQUE as nonUnique
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('flights', 'bookings')
    ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching indexes");
    }
    res.json(results);
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