-- ============================
-- 1. CUSTOMERS
-- ============================
CREATE TABLE customers (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255),
    phone           VARCHAR(50),
    address_line1   VARCHAR(255),
    address_line2   VARCHAR(255),
    city            VARCHAR(100),
    postcode        VARCHAR(20),
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 2. STAFF
-- ============================
CREATE TABLE staff (
    id              SERIAL PRIMARY KEY,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    role            VARCHAR(100), -- cleaner, electrician, admin, etc.
    phone           VARCHAR(50),
    email           VARCHAR(255),
    active          BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 3. JOBS / BOOKINGS
-- ============================
CREATE TABLE jobs (
    id              SERIAL PRIMARY KEY,
    customer_id     INT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_type    VARCHAR(100) NOT NULL, -- cleaning, repair, plumbing, etc.
    description     TEXT,
    scheduled_date  TIMESTAMP NOT NULL,
    duration_hours  NUMERIC(4,2),
    price           NUMERIC(10,2),
    status          VARCHAR(50) DEFAULT 'scheduled', 
    -- scheduled, in_progress, completed, cancelled, no_show
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 4. STAFF ASSIGNMENTS
-- ============================
CREATE TABLE job_assignments (
    id              SERIAL PRIMARY KEY,
    job_id          INT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    staff_id        INT NOT NULL REFERENCES staff(id) ON DELETE SET NULL,
    assigned_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(job_id, staff_id)
);

-- ============================
-- 5. NOTES (CUSTOMER OR JOB)
-- ============================
CREATE TABLE notes (
    id              SERIAL PRIMARY KEY,
    customer_id     INT REFERENCES customers(id) ON DELETE CASCADE,
    job_id          INT REFERENCES jobs(id) ON DELETE CASCADE,
    staff_id        INT REFERENCES staff(id) ON DELETE SET NULL,
    content         TEXT NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================
-- 6. SERVICE HISTORY VIEW
-- ============================
CREATE VIEW customer_service_history AS
SELECT 
    c.id AS customer_id,
    c.first_name,
    c.last_name,
    j.id AS job_id,
    j.service_type,
    j.scheduled_date,
    j.status,
    j.price,
    j.description
FROM customers c
LEFT JOIN jobs j ON j.customer_id = c.id
ORDER BY c.id, j.scheduled_date DESC;

