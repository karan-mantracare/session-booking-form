-- 0. Table users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150),
    email VARCHAR(150),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Table company_locations
CREATE TABLE company_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code VARCHAR(50) UNIQUE NOT NULL,
    location_state VARCHAR(100) NOT NULL,
    location_city VARCHAR(100) NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table experts
CREATE TABLE experts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    expert_type VARCHAR(50) NOT NULL, -- e.g., 'Fulltime', 'Parttime', 'Reliever'
    joined_on DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table expert_to_company (Mapping Table)
CREATE TABLE expert_to_company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
    company_id UUID REFERENCES company_locations(id) ON DELETE CASCADE,
    days VARCHAR(20) NOT NULL,            -- e.g., 'Monday', 'Tuesday'
    start_time TIME NOT NULL,            -- 24hr format, e.g., '09:00'
    end_time TIME NOT NULL              -- 24hr format, e.g., '16:00'
);

-- 4. Table leaves
CREATE TABLE leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expert_id UUID REFERENCES experts(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    leave_reason VARCHAR(255),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Table special_off_days
CREATE TABLE special_off_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    off_date DATE NOT NULL,
    location_code VARCHAR(50) REFERENCES company_locations(location_code) ON DELETE CASCADE,
    reason VARCHAR(255),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Table bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_name VARCHAR(150) NOT NULL,
    employee_email VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location_code VARCHAR(50) NOT NULL,
    feeling TEXT,
    expert_id UUID REFERENCES experts(id) ON DELETE SET NULL,
    expert_name VARCHAR(150) NOT NULL,
    session_status VARCHAR(50) DEFAULT 'booked',
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration INT DEFAULT 60,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
