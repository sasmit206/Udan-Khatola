require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const db = require('./db/connection');

const app = express();
const dbPromise = db.promise();

const JWT_SECRET = process.env.JWT_SECRET || 'mysecret123';
const PORT = Number(process.env.PORT || 3000);
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_COMPANY_NAME = process.env.RAZORPAY_COMPANY_NAME || 'Udan Khatola';

let transporter = null;

nodemailer.createTestAccount((err, account) => {
  if (err) {
    console.error('Failed to generate test mail account:', err);
    return;
  }

  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass
    }
  });

  console.log('Mail Transporter Ready');
});

app.use(
  cors({
    origin: APP_ORIGIN,
    credentials: false
  })
);
app.use(express.json());

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).send('Invalid token');
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  });
}

function isRazorpayConfigured() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

async function ensurePaymentOrdersTable() {
  await dbPromise.query(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      flight_id INT NOT NULL,
      seats INT NOT NULL DEFAULT 1,
      amount INT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'INR',
      receipt VARCHAR(40) NOT NULL UNIQUE,
      passenger_name VARCHAR(100) NOT NULL,
      passenger_email VARCHAR(150) NOT NULL,
      passenger_phone VARCHAR(20) NOT NULL,
      razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
      razorpay_payment_id VARCHAR(100) NULL,
      razorpay_signature VARCHAR(255) NULL,
      payment_status VARCHAR(30) NOT NULL DEFAULT 'created',
      booking_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_payment_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_payment_orders_flight FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE RESTRICT,
      CONSTRAINT fk_payment_orders_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    )
  `);
}

async function seedFlights() {
  await dbPromise.query(
    `
      INSERT IGNORE INTO flights (
        flight_number,
        source,
        destination,
        departure_time,
        arrival_time,
        price,
        available_seats
      )
      VALUES
        ('AI101', 'Delhi', 'Mumbai', '2026-04-10 09:00:00', '2026-04-10 11:00:00', 5200.00, 24),
        ('6E202', 'Mumbai', 'Bangalore', '2026-04-10 13:30:00', '2026-04-10 15:15:00', 4300.00, 18),
        ('UK303', 'Delhi', 'Chennai', '2026-04-11 07:15:00', '2026-04-11 10:00:00', 6100.00, 12),
        ('AI404', 'Bangalore', 'Delhi', '2026-04-11 18:45:00', '2026-04-11 21:25:00', 5600.00, 20),
        ('SG505', 'Chennai', 'Mumbai', '2026-04-12 06:20:00', '2026-04-12 08:10:00', 4700.00, 16),
        ('6E611', 'Pune', 'Delhi', '2026-04-12 08:40:00', '2026-04-12 10:50:00', 4100.00, 22),
        ('AI722', 'Hyderabad', 'Kolkata', '2026-04-12 14:10:00', '2026-04-12 16:20:00', 4950.00, 19),
        ('UK833', 'Ahmedabad', 'Bangalore', '2026-04-13 06:55:00', '2026-04-13 09:05:00', 4550.00, 21),
        ('SG944', 'Kolkata', 'Goa', '2026-04-13 17:25:00', '2026-04-13 20:10:00', 6400.00, 14),
        ('AI855', 'Mumbai', 'Jaipur', '2026-04-14 11:15:00', '2026-04-14 13:05:00', 3850.00, 26),
        ('6E966', 'Delhi', 'Goa', '2026-04-14 15:30:00', '2026-04-14 18:05:00', 5850.00, 17),
        ('UK107', 'Chennai', 'Hyderabad', '2026-04-15 09:20:00', '2026-04-15 10:45:00', 3600.00, 28)
    `
  );
}

async function fetchFlightById(flightId) {
  const [rows] = await dbPromise.query(
    'SELECT * FROM flights WHERE id = ? LIMIT 1',
    [flightId]
  );
  return rows[0] || null;
}

async function createRazorpayOrder({ amount, receipt, notes }) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount,
      currency: 'INR',
      receipt,
      notes
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.description || 'Unable to create Razorpay order';
    throw new Error(message);
  }

  return data;
}

async function sendConfirmationEmail({ userId, flightId, seats }) {
  if (!transporter) {
    return;
  }

  try {
    const [users] = await dbPromise.query(
      'SELECT email, name FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    const [flights] = await dbPromise.query(
      'SELECT flight_number, source, destination, departure_time FROM flights WHERE id = ? LIMIT 1',
      [flightId]
    );

    if (!users.length || !flights.length) {
      return;
    }

    const user = users[0];
    const flight = flights[0];
    const mailOptions = {
      from: '"Udan Khatola" <bookings@udankhatola.com>',
      to: user.email,
      subject: `Booking Confirmed: ${flight.flight_number}`,
      text: `Hello ${user.name},\n\nYour booking for ${seats} seat(s) on flight ${flight.flight_number} from ${flight.source} to ${flight.destination} on ${new Date(flight.departure_time).toLocaleString()} has been confirmed.\n\nSafe travels!`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('EMAIL SENT');
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
  }
}

async function createBookingTransaction({ flightId, userId, seats }) {
  const connection = await dbPromise.getConnection();

  try {
    await connection.beginTransaction();

    const [updateResult] = await connection.query(
      `
        UPDATE flights
        SET available_seats = available_seats - ?
        WHERE id = ? AND available_seats >= ?
      `,
      [seats, flightId, seats]
    );

    if (updateResult.affectedRows === 0) {
      throw new Error('No seats available');
    }

    const [insertResult] = await connection.query(
      `
        INSERT INTO bookings (flight_id, user_id, seats_booked, status)
        VALUES (?, ?, ?, 'CONFIRMED')
      `,
      [flightId, userId, seats]
    );

    await connection.commit();

    return insertResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/* =========================
   PAYMENT CONFIG
========================= */
app.get('/api/payment/config', requireAuth, async (req, res) => {
  res.json({
    enabled: isRazorpayConfigured(),
    keyId: RAZORPAY_KEY_ID || null,
    companyName: RAZORPAY_COMPANY_NAME
  });
});

/* =========================
   GET FLIGHTS
========================= */
app.get('/api/flights', async (req, res) => {
  const source = req.query.source?.trim();
  const destination = req.query.destination?.trim();
  const maxPrice = req.query.maxPrice;

  const conditions = ['available_seats > 0'];
  const values = [];

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

  try {
    const [rows] = await dbPromise.query(
      `SELECT * FROM flights WHERE ${conditions.join(' AND ')} ORDER BY departure_time ASC`,
      values
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching flights');
  }
});

app.get('/api/flights/:id', async (req, res) => {
  try {
    const flight = await fetchFlightById(Number(req.params.id));

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    res.json(flight);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching flight' });
  }
});

/* =========================
   ADMIN - FLIGHTS
========================= */
app.get('/api/admin/flights', requireAdmin, async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      `
        SELECT *
        FROM flights
        ORDER BY departure_time ASC, id ASC
      `
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching flights' });
  }
});

app.post('/api/admin/flights', requireAdmin, async (req, res) => {
  const flightNumber = String(req.body.flight_number || '').trim().toUpperCase();
  const source = String(req.body.source || '').trim();
  const destination = String(req.body.destination || '').trim();
  const departureTime = String(req.body.departure_time || '').trim();
  const arrivalTime = String(req.body.arrival_time || '').trim();
  const price = Number(req.body.price);
  const availableSeats = Number(req.body.available_seats);

  if (!flightNumber || !source || !destination || !departureTime || !arrivalTime) {
    return res.status(400).json({ error: 'All flight fields are required.' });
  }

  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Price must be a valid positive number.' });
  }

  if (!Number.isInteger(availableSeats) || availableSeats <= 0) {
    return res.status(400).json({ error: 'Available seats must be a positive whole number.' });
  }

  if (source.toLowerCase() === destination.toLowerCase()) {
    return res.status(400).json({ error: 'Source and destination must be different.' });
  }

  const departureDate = new Date(departureTime);
  const arrivalDate = new Date(arrivalTime);

  if (Number.isNaN(departureDate.getTime()) || Number.isNaN(arrivalDate.getTime())) {
    return res.status(400).json({ error: 'Departure and arrival times must be valid.' });
  }

  if (arrivalDate <= departureDate) {
    return res.status(400).json({ error: 'Arrival time must be after departure time.' });
  }

  try {
    const [result] = await dbPromise.query(
      `
        INSERT INTO flights (
          flight_number,
          source,
          destination,
          departure_time,
          arrival_time,
          price,
          available_seats
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [flightNumber, source, destination, departureTime, arrivalTime, price, availableSeats]
    );

    const flight = await fetchFlightById(result.insertId);
    res.status(201).json({
      message: 'Flight created successfully.',
      flight
    });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Flight number already exists.' });
    }

    res.status(500).json({ error: 'Error creating flight' });
  }
});

/* =========================
   LEGACY BOOK FLIGHT
========================= */
app.post('/api/book', requireAuth, async (req, res) => {
  const flightId = Number(req.body.flight_id);
  const seats = Number(req.body.seats || 1);

  if (!flightId || !Number.isInteger(seats) || seats <= 0) {
    return res.status(400).send('Invalid booking request');
  }

  try {
    const bookingId = await createBookingTransaction({
      flightId,
      userId: req.user.userId,
      seats
    });

    sendConfirmationEmail({
      userId: req.user.userId,
      flightId,
      seats
    });

    res.json({ message: 'Booking successful', bookingId });
  } catch (error) {
    console.error(error);
    const status = error.message === 'No seats available' ? 400 : 500;
    res.status(status).send(error.message || 'Booking failed');
  }
});

/* =========================
   CREATE RAZORPAY ORDER
========================= */
app.post('/api/payments/create-order', requireAuth, async (req, res) => {
  const flightId = Number(req.body.flight_id);
  const seats = Number(req.body.seats || 1);
  const passengerName = String(req.body.passenger_name || '').trim();
  const passengerEmail = String(req.body.passenger_email || '').trim();
  const passengerPhone = String(req.body.passenger_phone || '').trim();

  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      error: 'Razorpay is not configured on the server yet.'
    });
  }

  if (!flightId || !Number.isInteger(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Please choose a valid flight and seat count.' });
  }

  if (!passengerName || !passengerEmail || !passengerPhone) {
    return res.status(400).json({ error: 'Passenger name, email and phone are required.' });
  }

  try {
    const flight = await fetchFlightById(flightId);

    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    if (flight.available_seats < seats) {
      return res.status(400).json({ error: 'Requested seats are no longer available.' });
    }

    const amount = Math.round(Number(flight.price) * seats * 100);
    const receipt = `flt_${flightId}_${Date.now()}`.slice(0, 40);

    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: {
        flight_id: String(flightId),
        user_id: String(req.user.userId),
        seats: String(seats)
      }
    });

    const [insertResult] = await dbPromise.query(
      `
        INSERT INTO payment_orders (
          user_id,
          flight_id,
          seats,
          amount,
          currency,
          receipt,
          passenger_name,
          passenger_email,
          passenger_phone,
          razorpay_order_id,
          payment_status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'created')
      `,
      [
        req.user.userId,
        flightId,
        seats,
        amount,
        'INR',
        receipt,
        passengerName,
        passengerEmail,
        passengerPhone,
        order.id
      ]
    );

    res.json({
      bookingRequestId: insertResult.insertId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      companyName: RAZORPAY_COMPANY_NAME,
      flight,
      passenger: {
        name: passengerName,
        email: passengerEmail,
        phone: passengerPhone
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Unable to start payment' });
  }
});

/* =========================
   VERIFY PAYMENT
========================= */
app.post('/api/payments/verify', requireAuth, async (req, res) => {
  const bookingRequestId = Number(req.body.bookingRequestId);
  const razorpayPaymentId = String(req.body.razorpay_payment_id || '').trim();
  const razorpayOrderId = String(req.body.razorpay_order_id || '').trim();
  const razorpaySignature = String(req.body.razorpay_signature || '').trim();

  if (!bookingRequestId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    return res.status(400).json({ error: 'Incomplete payment verification payload.' });
  }

  try {
    const [orders] = await dbPromise.query(
      `
        SELECT *
        FROM payment_orders
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [bookingRequestId, req.user.userId]
    );

    if (!orders.length) {
      return res.status(404).json({ error: 'Payment order not found.' });
    }

    const paymentOrder = orders[0];

    if (paymentOrder.booking_id) {
      return res.json({
        message: 'Payment already verified',
        bookingId: paymentOrder.booking_id
      });
    }

    if (paymentOrder.razorpay_order_id !== razorpayOrderId) {
      return res.status(400).json({ error: 'Order mismatch while verifying payment.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${paymentOrder.razorpay_order_id}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      await dbPromise.query(
        `
          UPDATE payment_orders
          SET razorpay_payment_id = ?, razorpay_signature = ?, payment_status = 'signature_mismatch'
          WHERE id = ?
        `,
        [razorpayPaymentId, razorpaySignature, bookingRequestId]
      );

      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    const bookingId = await createBookingTransaction({
      flightId: paymentOrder.flight_id,
      userId: paymentOrder.user_id,
      seats: paymentOrder.seats
    });

    await dbPromise.query(
      `
        UPDATE payment_orders
        SET razorpay_payment_id = ?, razorpay_signature = ?, payment_status = 'verified', booking_id = ?
        WHERE id = ?
      `,
      [razorpayPaymentId, razorpaySignature, bookingId, bookingRequestId]
    );

    sendConfirmationEmail({
      userId: paymentOrder.user_id,
      flightId: paymentOrder.flight_id,
      seats: paymentOrder.seats
    });

    res.json({
      message: 'Payment verified and booking confirmed.',
      bookingId
    });
  } catch (error) {
    console.error(error);
    const status = error.message === 'No seats available' ? 400 : 500;
    res.status(status).json({ error: error.message || 'Payment verification failed.' });
  }
});

/* =========================
   GET BOOKINGS
========================= */
app.get('/api/bookings', requireAuth, async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      `
        SELECT
          b.id,
          f.flight_number,
          f.source,
          f.destination,
          f.departure_time,
          f.arrival_time,
          f.price,
          b.seats_booked,
          b.booking_time,
          b.status
        FROM bookings b
        JOIN flights f ON b.flight_id = f.id
        WHERE b.user_id = ?
        ORDER BY b.booking_time DESC
      `,
      [req.user.userId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching bookings');
  }
});

/* =========================
   MARK COMPLETED
========================= */
app.put('/api/bookings/:id/complete', requireAuth, async (req, res) => {
  try {
    await dbPromise.query(
      `
        UPDATE bookings
        SET status = 'COMPLETED'
        WHERE id = ? AND user_id = ?
      `,
      [req.params.id, req.user.userId]
    );

    res.json({ message: 'Booking marked as completed' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to update booking');
  }
});

/* =========================
   CANCEL BOOKING
========================= */
app.put('/api/bookings/:id/cancel', requireAuth, async (req, res) => {
  try {
    const [results] = await dbPromise.query('CALL sp_cancel_booking(?)', [req.params.id]);
    res.json(results[0][0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Failed to cancel booking' });
  }
});

/* =========================
   ANALYTICS - REVENUE
========================= */
app.get('/api/analytics/revenue', async (req, res) => {
  try {
    const [results] = await dbPromise.query('CALL sp_revenue_report()');
    res.json(results[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching revenue report');
  }
});

/* =========================
   ANALYTICS - USER SUMMARY
========================= */
app.get('/api/analytics/user-summary', requireAuth, async (req, res) => {
  try {
    const [results] = await dbPromise.query('CALL sp_user_booking_summary(?)', [
      req.user.userId
    ]);

    res.json({
      summary: results[0][0],
      routeFrequency: results[1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching user summary');
  }
});

/* =========================
   ADMIN - BULK PRICE UPDATE
========================= */
app.post('/api/admin/bulk-price-update', requireAdmin, async (req, res) => {
  const { source, destination, percentage } = req.body;

  if (!source || !destination || percentage === undefined) {
    return res.status(400).send('Missing parameters');
  }

  try {
    const [results] = await dbPromise.query('CALL sp_bulk_price_update(?, ?, ?)', [
      source,
      destination,
      percentage
    ]);

    res.json({
      summary: results[0][0],
      updates: results[1]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/* =========================
   ADMIN - AUDIT LOG
========================= */
app.get('/api/admin/audit-log', requireAdmin, async (req, res) => {
  try {
    const [rows] = await dbPromise.query(
      'SELECT * FROM booking_audit_log ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching audit log');
  }
});

/* =========================
   ADMIN - INDEXES
========================= */
app.get('/api/admin/indexes', requireAdmin, async (req, res) => {
  try {
    const [rows] = await dbPromise.query(`
      SELECT TABLE_NAME AS tableName, INDEX_NAME AS indexName, COLUMN_NAME AS columnName, NON_UNIQUE AS nonUnique
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('flights', 'bookings', 'payment_orders')
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching indexes');
  }
});

/* =========================
   AUTH
========================= */
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await dbPromise.query(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
      `,
      [name, email, hashedPassword]
    );

    res.json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Signup failed');
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await dbPromise.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);

    if (!rows.length) {
      return res.status(400).send('User not found');
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).send('Invalid password');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error logging in');
  }
});

Promise.all([ensurePaymentOrdersTable(), seedFlights()])
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize payment tables:', error);
    process.exit(1);
  });
