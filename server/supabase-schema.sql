-- ═══════════════════════════════════════════════════════
-- CruPoint — Consolidated Schema for Supabase
--
-- Run this in the Supabase SQL Editor to set up all tables.
-- Combines schema.sql + all migrations (001–007b) + missing
-- tables (routes, route_stops, route_completions, field_notes,
-- accounts) that were created outside version control.
--
-- Safe to run multiple times (IF NOT EXISTS / IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════

-- ──────────────────────────────
-- Core tables (from schema.sql)
-- ──────────────────────────────

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email
  ON admins(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS crews (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  lead_name VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  crew_id INTEGER REFERENCES crews(id),
  crew_name VARCHAR(100),
  license_plate VARCHAR(20),
  vin VARCHAR(30),
  make_model VARCHAR(100),
  year INTEGER,
  truck_number VARCHAR(20),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30),
  license_number VARCHAR(100),
  cert_number VARCHAR(100),
  photo_filename VARCHAR(255),
  pin_hash VARCHAR(255),
  is_crew_lead BOOLEAN DEFAULT false,
  default_crew_id INTEGER REFERENCES crews(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(100),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chemicals (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(100),
  epa VARCHAR(50),
  active_ingredient VARCHAR(300),
  signal_word VARCHAR(20) DEFAULT 'CAUTION',
  restricted BOOLEAN DEFAULT false,
  sds_url TEXT,
  label_url TEXT,
  wx_temp JSONB,
  wx_humidity JSONB,
  wx_wind JSONB,
  wx_conditions JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spray_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  crew_name VARCHAR(100),
  crew_lead VARCHAR(100) NOT NULL,
  license VARCHAR(100) NOT NULL,
  property VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  equipment_id INTEGER REFERENCES equipment(id),
  equipment_name VARCHAR(200),
  total_mix_vol VARCHAR(50),
  target_pest VARCHAR(300),
  notes TEXT,
  wx_temp REAL,
  wx_humidity REAL,
  wx_wind_speed REAL,
  wx_wind_dir VARCHAR(10),
  wx_conditions VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spray_log_products (
  id SERIAL PRIMARY KEY,
  spray_log_id INTEGER REFERENCES spray_logs(id) ON DELETE CASCADE,
  chemical_id INTEGER REFERENCES chemicals(id),
  chemical_name VARCHAR(200) NOT NULL,
  epa VARCHAR(50),
  amount VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spray_log_photos (
  id SERIAL PRIMARY KEY,
  spray_log_id INTEGER REFERENCES spray_logs(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(50),
  size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spray_log_members (
  id SERIAL PRIMARY KEY,
  spray_log_id INTEGER REFERENCES spray_logs(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id),
  employee_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_crew_rosters (
  id SERIAL PRIMARY KEY,
  crew_id INTEGER REFERENCES crews(id),
  crew_name VARCHAR(100) NOT NULL,
  submitted_by_id INTEGER REFERENCES employees(id),
  submitted_by_name VARCHAR(200) NOT NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_roster_members (
  id SERIAL PRIMARY KEY,
  roster_id INTEGER REFERENCES daily_crew_rosters(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id),
  employee_name VARCHAR(200) NOT NULL,
  present BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────
-- Accounts & Groups (migration 002 + 006)
-- ──────────────────────────────

CREATE TABLE IF NOT EXISTS account_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#475569',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address VARCHAR(300) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2) DEFAULT 'CA',
  zip VARCHAR(20),
  latitude DECIMAL,
  longitude DECIMAL,
  contact_name VARCHAR(200),
  contact_phone VARCHAR(30),
  contact_email VARCHAR(255),
  account_type VARCHAR(50) DEFAULT 'residential',
  notes TEXT,
  group_id INTEGER REFERENCES account_groups(id),
  estimated_minutes INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accounts_group ON accounts(group_id);

-- ──────────────────────────────
-- Routes, Stops, Completions (missing from VCS — reconstructed from usage)
-- ──────────────────────────────

CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  crew_id INTEGER REFERENCES crews(id),
  day_of_week INTEGER,
  color VARCHAR(20) DEFAULT '#2F6FED',
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_stops (
  id SERIAL PRIMARY KEY,
  route_id INTEGER NOT NULL REFERENCES routes(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  stop_order INTEGER,
  estimated_minutes INTEGER DEFAULT 30,
  notes TEXT,
  frequency VARCHAR(20) DEFAULT 'weekly',
  interval_weeks INTEGER DEFAULT 1,
  season_start VARCHAR(5),
  season_end VARCHAR(5),
  service_status VARCHAR(20) DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_id, account_id)
);

CREATE TABLE IF NOT EXISTS route_completions (
  id SERIAL PRIMARY KEY,
  route_stop_id INTEGER NOT NULL REFERENCES route_stops(id),
  route_id INTEGER NOT NULL REFERENCES routes(id),
  completed_by_id INTEGER,
  completed_by_name VARCHAR(200) NOT NULL,
  work_date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'complete',
  notes TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  time_spent_minutes INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(route_stop_id, work_date)
);

CREATE TABLE IF NOT EXISTS field_notes (
  id SERIAL PRIMARY KEY,
  route_completion_id INTEGER NOT NULL REFERENCES route_completions(id),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  note_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────
-- Stop & Service Exceptions (migration 007)
-- ──────────────────────────────

CREATE TABLE IF NOT EXISTS stop_exceptions (
  id SERIAL PRIMARY KEY,
  route_stop_id INTEGER NOT NULL REFERENCES route_stops(id) ON DELETE CASCADE,
  exception_type VARCHAR(20) NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_plans (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  frequency VARCHAR(30) NOT NULL DEFAULT 'weekly',
  interval_weeks INTEGER DEFAULT 1,
  preferred_days INTEGER[] DEFAULT '{1}',
  route_id INTEGER REFERENCES routes(id) ON DELETE SET NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  season_start VARCHAR(5),
  season_end VARCHAR(5),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_exceptions (
  id SERIAL PRIMARY KEY,
  service_plan_id INTEGER NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,
  exception_type VARCHAR(20) NOT NULL,
  date_start DATE NOT NULL,
  date_end DATE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────
-- Schedule Events (migration 003)
-- ──────────────────────────────

CREATE TABLE IF NOT EXISTS schedule_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  notes TEXT,
  event_date DATE NOT NULL,
  start_time VARCHAR(10),
  end_time VARCHAR(10),
  event_type VARCHAR(30) DEFAULT 'task',
  color VARCHAR(20) DEFAULT '#3B82F6',
  crew_id INTEGER REFERENCES crews(id),
  account_id INTEGER REFERENCES accounts(id),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────
-- Resources & Categories (migration 004 + 005)
-- ──────────────────────────────

CREATE TABLE IF NOT EXISTS resource_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(30) DEFAULT 'folder',
  color VARCHAR(20) DEFAULT '#475569',
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES resource_categories(id),
  resource_type VARCHAR(20) DEFAULT 'link',
  url VARCHAR(500),
  filename VARCHAR(255),
  original_name VARCHAR(255),
  mime_type VARCHAR(100),
  file_size INTEGER,
  tags TEXT[],
  pinned BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS account_resources (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, resource_id)
);

-- ──────────────────────────────
-- Indexes
-- ──────────────────────────────

CREATE INDEX IF NOT EXISTS idx_spray_logs_created ON spray_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spray_logs_vehicle ON spray_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_spray_logs_crew ON spray_logs(crew_name);
CREATE INDEX IF NOT EXISTS idx_spray_log_products_log ON spray_log_products(spray_log_id);
CREATE INDEX IF NOT EXISTS idx_spray_log_photos_log ON spray_log_photos(spray_log_id);
CREATE INDEX IF NOT EXISTS idx_spray_log_members_log ON spray_log_members(spray_log_id);
CREATE INDEX IF NOT EXISTS idx_employees_crew ON employees(default_crew_id);
CREATE INDEX IF NOT EXISTS idx_daily_rosters_date ON daily_crew_rosters(work_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_rosters_crew ON daily_crew_rosters(crew_id);
CREATE INDEX IF NOT EXISTS idx_daily_roster_members_roster ON daily_roster_members(roster_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON schedule_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_crew ON schedule_events(crew_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_pinned ON resources(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_resources_account ON account_resources(account_id);
CREATE INDEX IF NOT EXISTS idx_account_resources_resource ON account_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_se_stop ON stop_exceptions(route_stop_id);
CREATE INDEX IF NOT EXISTS idx_se_dates ON stop_exceptions(date_start, date_end);
CREATE INDEX IF NOT EXISTS idx_sp_account ON service_plans(account_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_sp_route ON service_plans(route_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_sp_status ON service_plans(status) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_se_plan ON service_exceptions(service_plan_id);
