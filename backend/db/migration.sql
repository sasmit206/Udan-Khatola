-- ============================================================
-- FLIGHT BOOKING SYSTEM — PL/SQL MIGRATION
-- Indexes, Triggers, Stored Procedures (with Cursors)
-- ============================================================

USE flight_db;

-- ============================================================
-- 1. INDEXES — Optimize frequently-queried columns
-- ============================================================

-- Helper procedure to safely create indexes
DELIMITER //
DROP PROCEDURE IF EXISTS safe_create_index //
CREATE PROCEDURE safe_create_index(
  IN p_table VARCHAR(64),
  IN p_index VARCHAR(64),
  IN p_columns VARCHAR(256)
)
BEGIN
  DECLARE index_exists INT DEFAULT 0;
  SELECT COUNT(*) INTO index_exists
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table
    AND INDEX_NAME = p_index;

  IF index_exists = 0 THEN
    SET @sql = CONCAT('CREATE INDEX ', p_index, ' ON ', p_table, '(', p_columns, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

-- Speed up route-based searches (source + destination)
CALL safe_create_index('flights', 'idx_flights_source_dest', 'source, destination');

-- Speed up price-filter queries
CALL safe_create_index('flights', 'idx_flights_price', 'price');

-- Speed up departure time range queries  
CALL safe_create_index('flights', 'idx_flights_departure', 'departure_time');

-- Speed up status-based booking filters
CALL safe_create_index('bookings', 'idx_bookings_status', 'status');

-- Speed up booking time ordering
CALL safe_create_index('bookings', 'idx_bookings_time', 'booking_time');

-- Clean up helper
DROP PROCEDURE IF EXISTS safe_create_index;


-- ============================================================
-- 2. AUDIT TABLE — Used by triggers to log actions
-- ============================================================

CREATE TABLE IF NOT EXISTS booking_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  user_id INT,
  flight_id INT,
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  seats_affected INT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue summary cache table (populated by stored procedure)
CREATE TABLE IF NOT EXISTS revenue_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100),
  destination VARCHAR(100),
  total_bookings INT DEFAULT 0,
  total_seats_sold INT DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  avg_ticket_price DECIMAL(10,2) DEFAULT 0.00,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. TRIGGERS
-- ============================================================

-- Drop existing triggers if they exist (safe re-run)
DROP TRIGGER IF EXISTS trg_after_booking_insert;
DROP TRIGGER IF EXISTS trg_after_booking_update;
DROP TRIGGER IF EXISTS trg_before_flight_delete;

DELIMITER //

-- -------------------------------------------------------
-- TRIGGER 1: After a new booking is inserted
-- Logs the action into booking_audit_log
-- -------------------------------------------------------
CREATE TRIGGER trg_after_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
  INSERT INTO booking_audit_log (
    booking_id, user_id, flight_id,
    action, new_status, seats_affected, details
  )
  VALUES (
    NEW.id, NEW.user_id, NEW.flight_id,
    'BOOKING_CREATED', NEW.status, NEW.seats_booked,
    CONCAT('New booking created for flight_id=', NEW.flight_id,
           ', seats=', NEW.seats_booked)
  );
END //

-- -------------------------------------------------------
-- TRIGGER 2: After a booking status is updated
-- Logs status changes; if CANCELLED, restore seats
-- -------------------------------------------------------
CREATE TRIGGER trg_after_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  -- Log every status change
  IF OLD.status <> NEW.status THEN
    INSERT INTO booking_audit_log (
      booking_id, user_id, flight_id,
      action, old_status, new_status,
      seats_affected, details
    )
    VALUES (
      NEW.id, NEW.user_id, NEW.flight_id,
      CONCAT('STATUS_CHANGE_', NEW.status),
      OLD.status, NEW.status,
      NEW.seats_booked,
      CONCAT('Booking #', NEW.id, ' status changed from ',
             OLD.status, ' to ', NEW.status)
    );
  END IF;

  -- If cancelled, restore seats to the flight
  IF NEW.status = 'CANCELLED' AND OLD.status <> 'CANCELLED' THEN
    UPDATE flights
    SET available_seats = available_seats + NEW.seats_booked
    WHERE id = NEW.flight_id;
  END IF;
END //

-- -------------------------------------------------------
-- TRIGGER 3: Before deleting a flight
-- Prevent deletion if active bookings exist
-- -------------------------------------------------------
CREATE TRIGGER trg_before_flight_delete
BEFORE DELETE ON flights
FOR EACH ROW
BEGIN
  DECLARE active_count INT;

  SELECT COUNT(*) INTO active_count
  FROM bookings
  WHERE flight_id = OLD.id
    AND status = 'CONFIRMED';

  IF active_count > 0 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot delete flight: active bookings exist';
  END IF;
END //


-- ============================================================
-- 4. STORED PROCEDURES WITH CURSORS
-- ============================================================

-- Drop existing procedures (safe re-run)
DROP PROCEDURE IF EXISTS sp_revenue_report;
DROP PROCEDURE IF EXISTS sp_user_booking_summary;
DROP PROCEDURE IF EXISTS sp_cancel_booking;
DROP PROCEDURE IF EXISTS sp_bulk_price_update;

-- -------------------------------------------------------
-- PROCEDURE 1: sp_revenue_report
-- Uses a CURSOR to iterate over all distinct routes,
-- calculates revenue per route from bookings
-- -------------------------------------------------------
CREATE PROCEDURE sp_revenue_report()
BEGIN
  DECLARE v_source VARCHAR(100);
  DECLARE v_destination VARCHAR(100);
  DECLARE v_total_bookings INT;
  DECLARE v_total_seats INT;
  DECLARE v_total_revenue DECIMAL(12,2);
  DECLARE v_avg_price DECIMAL(10,2);
  DECLARE v_done INT DEFAULT 0;

  -- Cursor over all distinct routes
  DECLARE route_cursor CURSOR FOR
    SELECT DISTINCT source, destination FROM flights;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  -- Clear previous summary
  DELETE FROM revenue_summary;

  OPEN route_cursor;

  route_loop: LOOP
    FETCH route_cursor INTO v_source, v_destination;
    IF v_done = 1 THEN
      LEAVE route_loop;
    END IF;

    -- Calculate revenue for this route using cursor iteration
    SELECT
      COUNT(b.id),
      COALESCE(SUM(b.seats_booked), 0),
      COALESCE(SUM(b.seats_booked * f.price), 0),
      COALESCE(AVG(f.price), 0)
    INTO v_total_bookings, v_total_seats, v_total_revenue, v_avg_price
    FROM bookings b
    JOIN flights f ON b.flight_id = f.id
    WHERE f.source = v_source
      AND f.destination = v_destination
      AND b.status IN ('CONFIRMED', 'COMPLETED');

    INSERT INTO revenue_summary
      (source, destination, total_bookings, total_seats_sold,
       total_revenue, avg_ticket_price)
    VALUES
      (v_source, v_destination, v_total_bookings, v_total_seats,
       v_total_revenue, v_avg_price);
  END LOOP;

  CLOSE route_cursor;

  -- Return the computed summary
  SELECT * FROM revenue_summary ORDER BY total_revenue DESC;
END //

-- -------------------------------------------------------
-- PROCEDURE 2: sp_user_booking_summary
-- Uses a CURSOR to iterate over a user's bookings
-- and compute personal travel statistics
-- -------------------------------------------------------
CREATE PROCEDURE sp_user_booking_summary(IN p_user_id INT)
BEGIN
  DECLARE v_booking_id INT;
  DECLARE v_flight_id INT;
  DECLARE v_seats INT;
  DECLARE v_status VARCHAR(20);
  DECLARE v_price DECIMAL(10,2);
  DECLARE v_source VARCHAR(100);
  DECLARE v_destination VARCHAR(100);
  DECLARE v_done INT DEFAULT 0;

  -- Accumulators
  DECLARE v_total_spent DECIMAL(12,2) DEFAULT 0;
  DECLARE v_total_flights INT DEFAULT 0;
  DECLARE v_confirmed_count INT DEFAULT 0;
  DECLARE v_completed_count INT DEFAULT 0;
  DECLARE v_cancelled_count INT DEFAULT 0;

  DECLARE booking_cursor CURSOR FOR
    SELECT b.id, b.flight_id, b.seats_booked, b.status,
           f.price, f.source, f.destination
    FROM bookings b
    JOIN flights f ON b.flight_id = f.id
    WHERE b.user_id = p_user_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  -- Create a temp table for per-route breakdown
  DROP TEMPORARY TABLE IF EXISTS tmp_route_freq;
  CREATE TEMPORARY TABLE tmp_route_freq (
    route VARCHAR(200),
    trip_count INT DEFAULT 0,
    route_spend DECIMAL(12,2) DEFAULT 0
  );

  OPEN booking_cursor;

  booking_loop: LOOP
    FETCH booking_cursor INTO v_booking_id, v_flight_id, v_seats,
                              v_status, v_price, v_source, v_destination;
    IF v_done = 1 THEN
      LEAVE booking_loop;
    END IF;

    SET v_total_flights = v_total_flights + 1;

    IF v_status = 'CONFIRMED' THEN
      SET v_confirmed_count = v_confirmed_count + 1;
      SET v_total_spent = v_total_spent + (v_price * v_seats);
    ELSEIF v_status = 'COMPLETED' THEN
      SET v_completed_count = v_completed_count + 1;
      SET v_total_spent = v_total_spent + (v_price * v_seats);
    ELSEIF v_status = 'CANCELLED' THEN
      SET v_cancelled_count = v_cancelled_count + 1;
      -- Cancelled bookings don't count as spent
    END IF;

    -- Track route frequency
    IF EXISTS (
      SELECT 1 FROM tmp_route_freq
      WHERE route = CONCAT(v_source, ' → ', v_destination)
    ) THEN
      UPDATE tmp_route_freq
      SET trip_count = trip_count + 1,
          route_spend = route_spend + (v_price * v_seats)
      WHERE route = CONCAT(v_source, ' → ', v_destination);
    ELSE
      INSERT INTO tmp_route_freq (route, trip_count, route_spend)
      VALUES (CONCAT(v_source, ' → ', v_destination), 1, v_price * v_seats);
    END IF;
  END LOOP;

  CLOSE booking_cursor;

  -- Result set 1: overall summary
  SELECT
    v_total_flights AS total_bookings,
    v_confirmed_count AS confirmed,
    v_completed_count AS completed,
    v_cancelled_count AS cancelled,
    v_total_spent AS total_spent,
    CASE WHEN v_total_flights > 0
      THEN ROUND(v_total_spent / v_total_flights, 2)
      ELSE 0
    END AS avg_per_booking;

  -- Result set 2: route frequency breakdown
  SELECT * FROM tmp_route_freq ORDER BY trip_count DESC;

  DROP TEMPORARY TABLE IF EXISTS tmp_route_freq;
END //

-- -------------------------------------------------------
-- PROCEDURE 3: sp_cancel_booking
-- Cancels a booking (which fires trg_after_booking_update
-- to restore seats and log the action)
-- -------------------------------------------------------
CREATE PROCEDURE sp_cancel_booking(IN p_booking_id INT)
BEGIN
  DECLARE v_current_status VARCHAR(20);
  DECLARE v_flight_id INT;

  -- Check current status
  SELECT status, flight_id INTO v_current_status, v_flight_id
  FROM bookings
  WHERE id = p_booking_id;

  IF v_current_status IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Booking not found';
  END IF;

  IF v_current_status = 'CANCELLED' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Booking is already cancelled';
  END IF;

  IF v_current_status = 'COMPLETED' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot cancel a completed booking';
  END IF;

  -- Update status to CANCELLED
  -- This fires trg_after_booking_update which:
  --   1) Logs to booking_audit_log
  --   2) Restores available_seats on the flight
  UPDATE bookings
  SET status = 'CANCELLED'
  WHERE id = p_booking_id;

  SELECT 'Booking cancelled successfully' AS message,
         p_booking_id AS booking_id,
         v_flight_id AS flight_id;
END //

-- -------------------------------------------------------
-- PROCEDURE 4: sp_bulk_price_update
-- Uses a CURSOR to iterate over flights on a route
-- and apply a percentage price change
-- -------------------------------------------------------
CREATE PROCEDURE sp_bulk_price_update(
  IN p_source VARCHAR(100),
  IN p_destination VARCHAR(100),
  IN p_percentage DECIMAL(5,2)
)
BEGIN
  DECLARE v_flight_id INT;
  DECLARE v_old_price DECIMAL(10,2);
  DECLARE v_new_price DECIMAL(10,2);
  DECLARE v_flight_number VARCHAR(20);
  DECLARE v_done INT DEFAULT 0;
  DECLARE v_updated_count INT DEFAULT 0;

  DECLARE flight_cursor CURSOR FOR
    SELECT id, flight_number, price
    FROM flights
    WHERE source = p_source AND destination = p_destination;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  -- Temp table to store update results
  DROP TEMPORARY TABLE IF EXISTS tmp_price_updates;
  CREATE TEMPORARY TABLE tmp_price_updates (
    flight_id INT,
    flight_number VARCHAR(20),
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    change_pct DECIMAL(5,2)
  );

  OPEN flight_cursor;

  price_loop: LOOP
    FETCH flight_cursor INTO v_flight_id, v_flight_number, v_old_price;
    IF v_done = 1 THEN
      LEAVE price_loop;
    END IF;

    -- Calculate new price
    SET v_new_price = ROUND(v_old_price * (1 + p_percentage / 100), 2);

    -- Ensure price doesn't go below 0
    IF v_new_price < 0 THEN
      SET v_new_price = 0;
    END IF;

    -- Update the flight price
    UPDATE flights SET price = v_new_price WHERE id = v_flight_id;

    -- Log the change
    INSERT INTO tmp_price_updates
      (flight_id, flight_number, old_price, new_price, change_pct)
    VALUES
      (v_flight_id, v_flight_number, v_old_price, v_new_price, p_percentage);

    SET v_updated_count = v_updated_count + 1;
  END LOOP;

  CLOSE flight_cursor;

  -- Return results
  SELECT v_updated_count AS flights_updated,
         p_source AS source,
         p_destination AS destination,
         p_percentage AS percentage_change;

  SELECT * FROM tmp_price_updates;

  DROP TEMPORARY TABLE IF EXISTS tmp_price_updates;
END //

DELIMITER ;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
SELECT 'Migration complete: Indexes, Triggers, and Stored Procedures installed.' AS status;
