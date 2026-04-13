CREATE DATABASE IF NOT EXISTS flight_db;
USE flight_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_number VARCHAR(20) NOT NULL UNIQUE,
  source VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NULL,
  price DECIMAL(10,2) NOT NULL,
  available_seats INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  user_id INT NOT NULL,
  seats_booked INT NOT NULL DEFAULT 1,
  status ENUM('CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_flight
    FOREIGN KEY (flight_id) REFERENCES flights(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

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
  CONSTRAINT fk_payment_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payment_orders_flight
    FOREIGN KEY (flight_id) REFERENCES flights(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_payment_orders_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ON DELETE SET NULL
);

INSERT INTO flights (flight_number, source, destination, departure_time, arrival_time, price, available_seats)
SELECT * FROM (
  SELECT 'AI101', 'Delhi', 'Mumbai', '2026-04-10 09:00:00', '2026-04-10 11:00:00', 5200.00, 24
  UNION ALL
  SELECT '6E202', 'Mumbai', 'Bangalore', '2026-04-10 13:30:00', '2026-04-10 15:15:00', 4300.00, 18
  UNION ALL
  SELECT 'UK303', 'Delhi', 'Chennai', '2026-04-11 07:15:00', '2026-04-11 10:00:00', 6100.00, 12
  UNION ALL
  SELECT 'AI404', 'Bangalore', 'Delhi', '2026-04-11 18:45:00', '2026-04-11 21:25:00', 5600.00, 20
  UNION ALL
  SELECT 'SG505', 'Chennai', 'Mumbai', '2026-04-12 06:20:00', '2026-04-12 08:10:00', 4700.00, 16
  UNION ALL
  SELECT '6E611', 'Pune', 'Delhi', '2026-04-12 08:40:00', '2026-04-12 10:50:00', 4100.00, 22
  UNION ALL
  SELECT 'AI722', 'Hyderabad', 'Kolkata', '2026-04-12 14:10:00', '2026-04-12 16:20:00', 4950.00, 19
  UNION ALL
  SELECT 'UK833', 'Ahmedabad', 'Bangalore', '2026-04-13 06:55:00', '2026-04-13 09:05:00', 4550.00, 21
  UNION ALL
  SELECT 'SG944', 'Kolkata', 'Goa', '2026-04-13 17:25:00', '2026-04-13 20:10:00', 6400.00, 14
  UNION ALL
  SELECT 'AI855', 'Mumbai', 'Jaipur', '2026-04-14 11:15:00', '2026-04-14 13:05:00', 3850.00, 26
  UNION ALL
  SELECT '6E966', 'Delhi', 'Goa', '2026-04-14 15:30:00', '2026-04-14 18:05:00', 5850.00, 17
  UNION ALL
  SELECT 'UK107', 'Chennai', 'Hyderabad', '2026-04-15 09:20:00', '2026-04-15 10:45:00', 3600.00, 28
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM flights);
