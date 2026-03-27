const express = require('express');
const cors = require('cors');
const db = require('./db/connection');

const app = express();

app.use(cors());
app.use(express.json());

// Initialize database with sample data
db.query(`
  CREATE TABLE IF NOT EXISTS flights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('Error creating flights table:', err);
  } else {
    console.log('Flights table ready');
    // Insert sample data
    const sampleFlights = [
      { source: 'Delhi', destination: 'Mumbai', price: 4500.00 },
      { source: 'Delhi', destination: 'Bangalore', price: 5200.00 },
      { source: 'Delhi', destination: 'Chennai', price: 5800.00 },
      { source: 'Mumbai', destination: 'Delhi', price: 4500.00 },
      { source: 'Mumbai', destination: 'Bangalore', price: 3800.00 },
      { source: 'Mumbai', destination: 'Chennai', price: 4200.00 },
      { source: 'Bangalore', destination: 'Delhi', price: 5200.00 },
      { source: 'Bangalore', destination: 'Mumbai', price: 3800.00 },
      { source: 'Bangalore', destination: 'Chennai', price: 3500.00 },
      { source: 'Chennai', destination: 'Delhi', price: 5800.00 },
      { source: 'Chennai', destination: 'Mumbai', price: 4200.00 },
      { source: 'Chennai', destination: 'Bangalore', price: 3500.00 }
    ];

    sampleFlights.forEach(flight => {
      db.query('INSERT IGNORE INTO flights (source, destination, price) VALUES (?, ?, ?)',
        [flight.source, flight.destination, flight.price], (err) => {
          if (err) console.error('Error inserting sample flight:', err);
        });
    });
  }
});

// Create bookings table
db.query(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flight_id INT NOT NULL,
    user_name VARCHAR(100) DEFAULT 'Guest',
    seats_booked INT DEFAULT 1,
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(id)
  )
`, (err) => {
  if (err) {
    console.error('Error creating bookings table:', err);
  } else {
    console.log('Bookings table ready');
  }
});

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

  let query = 'SELECT * FROM flights';

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  console.log("SQL:", query);
  console.log("Values:", values);
  console.log("Query Params:", req.query);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching flights');
    }
    res.json(result);
  });
});

app.post('/api/book', (req, res) => {
  const { flight_id } = req.body;

  const query = `
    INSERT INTO bookings (flight_id, user_name, seats_booked)
    VALUES (?, ?, ?)
  `;

  db.query(query, [flight_id, "Guest", 1], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Booking failed");
    }

    res.json({ message: "Booking successful" });
  });
});

app.get('/api/bookings', (req, res) => {
  const query = `
    SELECT b.id, f.source, f.destination, f.price, b.booking_time
    FROM bookings b
    JOIN flights f ON b.flight_id = f.id
  `;

  db.query(query, (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
});