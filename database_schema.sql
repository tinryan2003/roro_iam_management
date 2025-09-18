-- Create database if not exists
CREATE DATABASE IF NOT EXISTS roro_management_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE roro_management_system;

-- ================================================
-- 1. ACCOUNTS TABLE (User Authentication & Authorization)
-- ================================================
CREATE TABLE accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    date_of_birth DATE,
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at DATETIME,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME,
    keycloak_user_id VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Unique constraints for multi-role support
    UNIQUE KEY unique_username_role (username),
    UNIQUE KEY unique_email_role (email),
    
    -- Indexes for performance
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_keycloak_user_id (keycloak_user_id),
    INDEX idx_is_active (is_active)
);

-- ================================================
-- 2. PORTS TABLE (Ferry Terminal Locations)
-- ================================================
CREATE TABLE ports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    port_code VARCHAR(10) NOT NULL UNIQUE,
    port_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_port_code (port_code),
    INDEX idx_is_active (is_active)
);

-- ================================================
-- 3. ROUTES TABLE (Ferry Routes Between Ports)
-- ================================================
CREATE TABLE routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_code VARCHAR(20) NOT NULL UNIQUE,
    route_name VARCHAR(100) NOT NULL,
    departure_port_id BIGINT NOT NULL,
    arrival_port_id BIGINT NOT NULL,
    distance_km DECIMAL(8,2),
    estimated_duration_minutes INT NOT NULL,
    base_passenger_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    base_vehicle_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (departure_port_id) REFERENCES ports(id) ON DELETE RESTRICT,
    FOREIGN KEY (arrival_port_id) REFERENCES ports(id) ON DELETE RESTRICT,
    
    -- Prevent circular routes
    CHECK (departure_port_id != arrival_port_id),
    
    INDEX idx_route_code (route_code),
    INDEX idx_departure_port (departure_port_id),
    INDEX idx_arrival_port (arrival_port_id),
    INDEX idx_is_active (is_active)
);

-- ================================================
-- 4. FERRIES TABLE (Ferry Vessels)
-- ================================================
CREATE TABLE ferries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ferry_code VARCHAR(20) NOT NULL UNIQUE,
    ferry_name VARCHAR(100) NOT NULL,
    vessel_type VARCHAR(50),
    max_vehicle_capacity INT NOT NULL DEFAULT 0,
    max_passenger_capacity INT NOT NULL DEFAULT 0,
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE') DEFAULT 'ACTIVE',
    built_year YEAR,
    registration_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_ferry_code (ferry_code),
    INDEX idx_status (status),
    INDEX idx_is_active (is_active)
);

-- ================================================
-- 5. SCHEDULES TABLE (Ferry Departure Schedules)
-- ================================================
CREATE TABLE schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    route_id BIGINT NOT NULL,
    ferry_id BIGINT NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    status ENUM('SCHEDULED', 'BOARDING', 'DEPARTED', 'ARRIVED', 'CANCELLED', 'DELAYED') DEFAULT 'SCHEDULED',
    available_vehicle_spaces INT,
    available_passenger_spaces INT,
    booking_deadline DATETIME,
    check_in_start_time TIME,
    check_in_end_time TIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT,
    FOREIGN KEY (ferry_id) REFERENCES ferries(id) ON DELETE RESTRICT,
    
    -- Prevent double-booking ferry at same time
    UNIQUE KEY unique_ferry_departure (ferry_id, departure_time),
    
    INDEX idx_route_id (route_id),
    INDEX idx_ferry_id (ferry_id),
    INDEX idx_departure_time (departure_time),
    INDEX idx_status (status)
);

-- ================================================
-- 6. CUSTOMERS TABLE (Customer Profiles)
-- ================================================
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_code VARCHAR(20) NOT NULL UNIQUE,
    account_id BIGINT NOT NULL,
    company_name VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    
    INDEX idx_customer_code (customer_code),
    INDEX idx_account_id (account_id)
);

-- ================================================
-- 7. EMPLOYEES TABLE (Employee Profiles)
-- ================================================
CREATE TABLE employees (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_code VARCHAR(20) NOT NULL UNIQUE,
    account_id BIGINT NOT NULL,
    position ENUM('MANAGER', 'SUPERVISOR', 'OPERATOR', 'ADMIN', 'CUSTOMER_SERVICE', 'FINANCE', 'SECURITY') NOT NULL,
    hire_date DATE,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    
    INDEX idx_employee_code (employee_code),
    INDEX idx_account_id (account_id),
    INDEX idx_position (position),
    INDEX idx_is_active (is_active)
);

-- ================================================
-- 8. VEHICLES TABLE (Customer Vehicle Information)
-- ================================================
CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    booking_id BIGINT,
    vehicle_type ENUM('CAR', 'TRUCK', 'MOTORCYCLE', 'BUS', 'VAN') NOT NULL,
    make VARCHAR(50),
    model VARCHAR(50),
    quantity INT NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    
    INDEX idx_customer_id (customer_id),
    INDEX idx_booking_id (booking_id),
    INDEX idx_vehicle_type (vehicle_type),
    INDEX idx_is_active (is_active)
);

-- ================================================
-- 9. BOOKINGS TABLE (Ferry Reservations)
-- ================================================
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    passenger_count INT NOT NULL DEFAULT 0,
    vehicle_count INT NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'WAITING_FOR_PAYMENT', 'PAID', 'REFUNDED', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED', 'IN_REVIEW', 'IN_REFUND') DEFAULT 'PENDING',
    booking_date DATETIME NOT NULL,
    expiry_date DATETIME,
    payment_deadline DATETIME,
    special_requests TEXT,
    cancellation_reason TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_reason TEXT,
    admin_notes TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE RESTRICT,
    
    INDEX idx_booking_code (booking_code),
    INDEX idx_customer_id (customer_id),
    INDEX idx_schedule_id (schedule_id),
    INDEX idx_status (status),
    INDEX idx_booking_date (booking_date)
);

-- Update vehicles table to add foreign key after bookings table is created
ALTER TABLE vehicles 
ADD CONSTRAINT fk_vehicles_booking 
FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;

-- ================================================
-- 10. APPROVALS TABLE (Booking Approval Workflow)
-- ================================================
CREATE TABLE approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    status ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    review_started_at DATETIME,
    review_deadline DATETIME,
    reviewed_by BIGINT,
    reviewed_at DATETIME,
    review_notes TEXT,
    approved_at DATETIME,
    approved_by BIGINT,
    approval_notes TEXT,
    rejected_by BIGINT,
    rejection_reason TEXT,
    rejected_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES accounts(id) ON DELETE SET NULL,
    FOREIGN KEY (rejected_by) REFERENCES accounts(id) ON DELETE SET NULL,
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status),
    INDEX idx_reviewed_by (reviewed_by),
    INDEX idx_approved_by (approved_by)
);

-- ================================================
-- 11. PAYMENTS TABLE (Payment Transactions)
-- ================================================
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_number VARCHAR(30) NOT NULL UNIQUE,
    booking_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'PAYPAL', 'WALLET') NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED') DEFAULT 'PENDING',
    transaction_id VARCHAR(100),
    payment_date DATETIME,
    reference_number VARCHAR(50),
    gateway_response TEXT,
    failure_reason TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0.00,
    refund_date DATETIME,
    notes TEXT,
    processed_by BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES accounts(id) ON DELETE SET NULL,
    
    INDEX idx_payment_number (payment_number),
    INDEX idx_booking_id (booking_id),
    INDEX idx_status (status),
    INDEX idx_payment_date (payment_date),
    INDEX idx_transaction_id (transaction_id)
);

-- ================================================
-- 12. BOOKING_RECORDS TABLE (Audit Trail)
-- ================================================
CREATE TABLE booking_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    action ENUM('CREATED', 'UPDATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED', 'REFUNDED', 'COMPLETED') NOT NULL,
    performed_by BIGINT,
    description VARCHAR(1000),
    previous_values TEXT,
    current_values TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    session_id VARCHAR(100),
    additional_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES accounts(id) ON DELETE SET NULL,
    
    INDEX idx_booking_id (booking_id),
    INDEX idx_action (action),
    INDEX idx_performed_by (performed_by),
    INDEX idx_created_at (created_at)
);

-- ================================================
-- 13. NOTIFICATIONS TABLE (System Notifications)
-- ================================================
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recipient_id VARCHAR(50) NOT NULL,
    recipient_type ENUM('CUSTOMER', 'EMPLOYEE', 'ADMIN') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    priority ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
    channel ENUM('EMAIL', 'SMS', 'PUSH', 'IN_APP', 'SYSTEM_LOG') NOT NULL,
    status ENUM('SENT', 'FAILED', 'UNREAD', 'READ', 'LOGGED') NOT NULL DEFAULT 'UNREAD',
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    metadata TEXT,
    
    INDEX idx_recipient (recipient_id, recipient_type),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- ================================================
-- SAMPLE DATA FOR DEVELOPMENT/TESTING
-- ================================================

-- Sample Ports
INSERT INTO ports (port_code, port_name, city, country) VALUES
('VNSGN', 'Saigon Port', 'Ho Chi Minh City', 'Vietnam'),
('VNVUT', 'Vung Tau Port', 'Vung Tau', 'Vietnam'),
('VNHAN', 'Haiphong Port', 'Haiphong', 'Vietnam'),
('VNPQT', 'Phu Quoc Port', 'Phu Quoc', 'Vietnam'),
('VNCAN', 'Can Tho Port', 'Can Tho', 'Vietnam');

-- Sample Routes
INSERT INTO routes (route_code, route_name, departure_port_id, arrival_port_id, distance_km, estimated_duration_minutes, base_passenger_price, base_vehicle_price) VALUES
('SGN-VUT', 'Saigon to Vung Tau Express', 1, 2, 125.50, 180, 25.00, 50.00),
('VUT-SGN', 'Vung Tau to Saigon Express', 2, 1, 125.50, 180, 25.00, 50.00),
('SGN-PQT', 'Saigon to Phu Quoc Ferry', 1, 4, 320.75, 480, 75.00, 150.00),
('PQT-SGN', 'Phu Quoc to Saigon Ferry', 4, 1, 320.75, 480, 75.00, 150.00),
('CAN-PQT', 'Can Tho to Phu Quoc Ferry', 5, 4, 180.25, 300, 45.00, 90.00);

-- Sample Ferries
INSERT INTO ferries (ferry_code, ferry_name, vessel_type, max_vehicle_capacity, max_passenger_capacity, status) VALUES
('VN-F001', 'Saigon Express I', 'RoRo Ferry', 50, 200, 'ACTIVE'),
('VN-F002', 'Mekong Star', 'RoRo Ferry', 75, 300, 'ACTIVE'),
('VN-F003', 'Phu Quoc Pearl', 'RoRo Ferry', 40, 180, 'ACTIVE'),
('VN-F004', 'Vung Tau Breeze', 'RoRo Ferry', 60, 250, 'ACTIVE'),
('VN-F005', 'Delta Queen', 'RoRo Ferry', 35, 150, 'MAINTENANCE');

-- Sample Admin Account
INSERT INTO accounts (username, email, first_name, last_name, phone_number, is_active, is_verified) VALUES
('admin', 'admin@ropax.com', 'System', 'Administrator', '+84901234567', TRUE, TRUE),
('john.manager', 'john.manager@ropax.com', 'John', 'Manager', '+84901234568', TRUE, TRUE),
('jane.customer', 'jane.customer@example.com', 'Jane', 'Smith', '+84901234569', TRUE, TRUE);

-- Sample Employee
INSERT INTO employees (employee_code, account_id, position, hire_date, salary, is_active) VALUES
('EMP001', 1, 'ADMIN', '2024-01-01', 50000.00, TRUE),
('EMP002', 2, 'MANAGER', '2024-01-15', 35000.00, TRUE);

-- Sample Customer
INSERT INTO customers (customer_code, account_id, company_name) VALUES
('CUST001', 3, NULL);

-- Sample Schedules
INSERT INTO schedules (route_id, ferry_id, departure_time, arrival_time, available_vehicle_spaces, available_passenger_spaces, booking_deadline) VALUES
(1, 1, '2024-12-01 08:00:00', '2024-12-01 11:00:00', 50, 200, '2024-12-01 06:00:00'),
(2, 2, '2024-12-01 14:00:00', '2024-12-01 17:00:00', 75, 300, '2024-12-01 12:00:00'),
(3, 3, '2024-12-02 09:00:00', '2024-12-02 17:00:00', 40, 180, '2024-12-02 07:00:00');

-- ================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ================================================

-- Composite indexes for common queries
CREATE INDEX idx_bookings_customer_status ON bookings(customer_id, status);
CREATE INDEX idx_schedules_route_departure ON schedules(route_id, departure_time);
CREATE INDEX idx_payments_booking_status ON payments(booking_id, status);
CREATE INDEX idx_approvals_status_created ON approvals(status, created_at);
CREATE INDEX idx_booking_records_booking_action ON booking_records(booking_id, action);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, is_read);

-- ================================================
-- VIEWS FOR COMMON QUERIES
-- ================================================

-- Complete booking information view
CREATE VIEW booking_details AS
SELECT 
    b.id,
    b.booking_code,
    b.status,
    b.passenger_count,
    b.vehicle_count,
    b.total_amount,
    b.booking_date,
    
    -- Customer information
    c.customer_code,
    CONCAT(acc.first_name, ' ', acc.last_name) AS customer_name,
    acc.email AS customer_email,
    
    -- Schedule information
    s.departure_time,
    s.arrival_time,
    
    -- Route information
    r.route_name,
    dp.port_name AS departure_port,
    ap.port_name AS arrival_port,
    
    -- Ferry information
    f.ferry_name,
    f.ferry_code,
    
    -- Payment status
    COALESCE(p.status, 'UNPAID') AS payment_status,
    p.payment_date,
    
    -- Approval status
    COALESCE(apr.status, 'PENDING') AS approval_status
    
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN accounts acc ON c.account_id = acc.id
LEFT JOIN schedules s ON b.schedule_id = s.id
LEFT JOIN routes r ON s.route_id = r.id
LEFT JOIN ports dp ON r.departure_port_id = dp.id
LEFT JOIN ports ap ON r.arrival_port_id = ap.id
LEFT JOIN ferries f ON s.ferry_id = f.id
LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'COMPLETED'
LEFT JOIN approvals apr ON b.id = apr.booking_id;

-- Ferry capacity utilization view
CREATE VIEW ferry_capacity_utilization AS
SELECT 
    f.id AS ferry_id,
    f.ferry_name,
    f.ferry_code,
    f.max_vehicle_capacity,
    f.max_passenger_capacity,
    s.id AS schedule_id,
    s.departure_time,
    s.available_vehicle_spaces,
    s.available_passenger_spaces,
    (f.max_vehicle_capacity - COALESCE(s.available_vehicle_spaces, f.max_vehicle_capacity)) AS used_vehicle_spaces,
    (f.max_passenger_capacity - COALESCE(s.available_passenger_spaces, f.max_passenger_capacity)) AS used_passenger_spaces,
    ROUND(((f.max_vehicle_capacity - COALESCE(s.available_vehicle_spaces, f.max_vehicle_capacity)) / f.max_vehicle_capacity) * 100, 2) AS vehicle_utilization_percent,
    ROUND(((f.max_passenger_capacity - COALESCE(s.available_passenger_spaces, f.max_passenger_capacity)) / f.max_passenger_capacity) * 100, 2) AS passenger_utilization_percent
FROM ferries f
LEFT JOIN schedules s ON f.id = s.ferry_id
WHERE f.is_active = TRUE;

-- ================================================
-- DATABASE SCHEMA CREATION COMPLETE
-- ================================================

-- Show summary of created tables
SELECT 
    'SCHEMA CREATED SUCCESSFULLY' AS status,
    COUNT(*) AS total_tables
FROM information_schema.tables 
WHERE table_schema = 'roro_management_system';