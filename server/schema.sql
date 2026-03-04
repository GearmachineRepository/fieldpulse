-- ═══════════════════════════════════════════════════════
-- FieldPulse — Database Schema (Phase 1)
-- Run this after creating the 'fieldpulse' database
-- ═══════════════════════════════════════════════════════

-- ── Vehicle PINs (for tablet authentication) ──
CREATE TABLE IF NOT EXISTS vehicles (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,          -- e.g. "Truck 1", "Van 3"
  pin_hash      VARCHAR(255) NOT NULL,          -- bcrypt hash of the PIN
  crew_name     VARCHAR(100),                   -- e.g. "Crew A"
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Equipment (admin-managed dropdown) ──
CREATE TABLE IF NOT EXISTS equipment (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,          -- e.g. "4 Gal Backpack Sprayer"
  type          VARCHAR(100),                   -- e.g. "Backpack", "Truck Mount"
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chemical Database ──
CREATE TABLE IF NOT EXISTS chemicals (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,          -- e.g. "Barricade 4FL"
  type          VARCHAR(100),                   -- e.g. "Pre-Emergent Herbicide"
  epa           VARCHAR(50),                    -- EPA registration number
  active_ingredient VARCHAR(300),
  signal_word   VARCHAR(20) DEFAULT 'CAUTION',  -- CAUTION, WARNING, DANGER
  restricted    BOOLEAN DEFAULT false,
  sds_url       TEXT,
  label_url     TEXT,
  -- Weather restrictions (JSON) — null means N/A on label
  wx_temp       JSONB,    -- e.g. {"op": ">", "value": 90, "warn": "Do not apply above 90°F"}
  wx_humidity   JSONB,
  wx_wind       JSONB,
  wx_conditions JSONB,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Spray Logs ──
CREATE TABLE IF NOT EXISTS spray_logs (
  id            SERIAL PRIMARY KEY,
  vehicle_id    INTEGER REFERENCES vehicles(id),
  crew_name     VARCHAR(100),
  crew_lead     VARCHAR(100) NOT NULL,
  license       VARCHAR(100) NOT NULL,
  property      VARCHAR(200) NOT NULL,
  location      VARCHAR(200),                   -- GPS coords or address
  equipment_id  INTEGER REFERENCES equipment(id),
  equipment_name VARCHAR(200),                  -- denormalized for history
  total_mix_vol VARCHAR(50),                    -- e.g. "4 gal"
  target_pest   VARCHAR(300),
  notes         TEXT,
  -- Weather snapshot at time of application
  wx_temp       REAL,
  wx_humidity   REAL,
  wx_wind_speed REAL,
  wx_wind_dir   VARCHAR(10),
  wx_conditions VARCHAR(50),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Products within each spray log (the mix sheet) ──
CREATE TABLE IF NOT EXISTS spray_log_products (
  id            SERIAL PRIMARY KEY,
  spray_log_id  INTEGER REFERENCES spray_logs(id) ON DELETE CASCADE,
  chemical_id   INTEGER REFERENCES chemicals(id),
  chemical_name VARCHAR(200) NOT NULL,          -- denormalized
  epa           VARCHAR(50),
  amount        VARCHAR(50) NOT NULL,           -- e.g. "3 oz", "12 ml"
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════
-- Seed Data — Default equipment and chemicals
-- ═══════════════════════════════════════════════════════

-- Equipment
INSERT INTO equipment (name, type) VALUES
  ('4 Gal Backpack Sprayer', 'Backpack'),
  ('Stihl SG 20 Backpack', 'Backpack'),
  ('25 Gal Skid Sprayer (Truck)', 'Truck Mount'),
  ('50 Gal Skid Sprayer (Truck)', 'Truck Mount'),
  ('100 Gal Skid Sprayer (Truck)', 'Truck Mount'),
  ('Z-Spray Ride-On', 'Ride-On'),
  ('Lesco HPS Spreader/Sprayer', 'Ride-On'),
  ('Hand Pump Sprayer — 2 Gal', 'Hand');

-- Chemicals
INSERT INTO chemicals (name, type, epa, active_ingredient, signal_word, restricted, sds_url, label_url, wx_temp, wx_humidity, wx_wind, wx_conditions) VALUES
  ('Barricade 4FL', 'Pre-Emergent Herbicide', '100-1139', 'Prodiamine 40.7%', 'CAUTION', false,
    'https://www.greencastonline.com/labels/barricade-4fl',
    'https://www.greencastonline.com/labels/barricade-4fl',
    '{"op": ">", "value": 90, "warn": "Do not apply above 90°F — reduced efficacy"}',
    NULL,
    '{"op": ">", "value": 10, "warn": "Do not apply above 10 mph — drift risk"}',
    NULL),
  ('Trimec Classic', 'Post-Emergent Herbicide', '2217-798', '2,4-D + Mecoprop-p + Dicamba', 'DANGER', false,
    'https://www.pbigordonturf.com/products/herbicides/selective-herbicides/trimec-professional-lawn-care-broadleaf-weed-killer/',
    'https://www.pbigordonturf.com/products/herbicides/selective-herbicides/trimec-professional-lawn-care-broadleaf-weed-killer/',
    '{"op": ">", "value": 85, "warn": "Risk of turf injury above 85°F"}',
    NULL,
    '{"op": ">", "value": 10, "warn": "Do not apply above 10 mph — drift risk"}',
    '{"op": "==", "value": "Overcast", "warn": "Reduced uptake in overcast / low-light"}'),
  ('Ammonium Sulfate 21-0-0', 'Fertilizer', 'N/A', '21% Nitrogen, 24% Sulfur', 'CAUTION', false,
    NULL, NULL,
    '{"op": ">", "value": 95, "warn": "Risk of burn above 95°F — water in immediately"}',
    NULL, NULL, NULL),
  ('Talstar P', 'Insecticide', '279-3206', 'Bifenthrin 7.9%', 'CAUTION', true,
    'https://labelsds.com/images/user_uploads/Talstar%20Prof%20SDS%202-14-23.PDF',
    'https://www.fmcprofessionalsolutions.com/specialty-products/talstar-professional/',
    NULL, NULL,
    '{"op": ">", "value": 10, "warn": "Do not apply above 10 mph"}',
    '{"op": "==", "value": "Overcast", "warn": "Apply during calm, clear conditions when possible"}'),
  ('Roundup Pro Max', 'Non-Selective Herbicide', '524-579', 'Glyphosate 48.7%', 'WARNING', false,
    'https://www.backedbybayer.com/pest-management/roundup-pro-max',
    'https://www.backedbybayer.com/pest-management/roundup-pro-max',
    NULL,
    '{"op": "<", "value": 30, "warn": "Low humidity reduces absorption — best above 40% RH"}',
    '{"op": ">", "value": 10, "warn": "Do not apply above 10 mph — drift kills non-target plants"}',
    NULL),
  ('Prodiamine 65 WDG', 'Pre-Emergent Herbicide', '62719-416', 'Prodiamine 65%', 'CAUTION', false,
    NULL, NULL,
    NULL, NULL,
    '{"op": ">", "value": 10, "warn": "Do not apply above 10 mph"}',
    NULL),
  ('Dismiss NXT', 'Post-Emergent Herbicide', '279-9630', 'Sulfentrazone + Imazethapyr', 'CAUTION', false,
    NULL, NULL,
    NULL, NULL,
    '{"op": ">", "value": 10, "warn": "Do not apply above 10 mph"}',
    '{"op": "==", "value": "Overcast", "warn": "Best applied in full sun for maximum uptake"}'),
  ('Surfactant (Non-Ionic)', 'Adjuvant', 'N/A', '80% Non-ionic surfactant', 'CAUTION', false,
    NULL, NULL, NULL, NULL, NULL, NULL),
  ('MSO Methylated Seed Oil', 'Adjuvant', 'N/A', 'Methylated seed oil', 'CAUTION', false,
    NULL, NULL, NULL, NULL, NULL, NULL),
  ('Marker Dye Blue', 'Indicator Dye', 'N/A', 'Colorant', 'CAUTION', false,
    NULL, NULL, NULL, NULL, NULL, NULL);

-- Default vehicle (for testing)
-- PIN: 1234 (bcrypt hash below)
INSERT INTO vehicles (name, pin_hash, crew_name) VALUES
  ('Truck 1', '$2a$10$xJ8Kx5GqX5ZV5YqK5vQ5QOQ5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', 'Crew A');

-- ═══════════════════════════════════════════════════════
-- Index for common queries
-- ═══════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_spray_logs_created ON spray_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spray_logs_vehicle ON spray_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_spray_log_products_log ON spray_log_products(spray_log_id);
