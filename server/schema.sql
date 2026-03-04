-- ═══════════════════════════════════════════════════════
-- FieldPulse — Database Schema (Phase 2.5)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'admin',
  active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crews (
  id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE,
  lead_name VARCHAR(100), active BOOLEAN DEFAULT true,
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
  photo_filename VARCHAR(255),
  default_crew_id INTEGER REFERENCES crews(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL,
  type VARCHAR(100), active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chemicals (
  id SERIAL PRIMARY KEY, name VARCHAR(200) NOT NULL,
  type VARCHAR(100), epa VARCHAR(50), active_ingredient VARCHAR(300),
  signal_word VARCHAR(20) DEFAULT 'CAUTION', restricted BOOLEAN DEFAULT false,
  sds_url TEXT, label_url TEXT,
  wx_temp JSONB, wx_humidity JSONB, wx_wind JSONB, wx_conditions JSONB,
  active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spray_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER REFERENCES vehicles(id),
  crew_name VARCHAR(100), crew_lead VARCHAR(100) NOT NULL,
  license VARCHAR(100) NOT NULL, property VARCHAR(200) NOT NULL,
  location VARCHAR(200),
  equipment_id INTEGER REFERENCES equipment(id),
  equipment_name VARCHAR(200), total_mix_vol VARCHAR(50),
  target_pest VARCHAR(300), notes TEXT,
  wx_temp REAL, wx_humidity REAL, wx_wind_speed REAL,
  wx_wind_dir VARCHAR(10), wx_conditions VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spray_log_products (
  id SERIAL PRIMARY KEY,
  spray_log_id INTEGER REFERENCES spray_logs(id) ON DELETE CASCADE,
  chemical_id INTEGER REFERENCES chemicals(id),
  chemical_name VARCHAR(200) NOT NULL, epa VARCHAR(50),
  amount VARCHAR(50) NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spray_log_photos (
  id SERIAL PRIMARY KEY,
  spray_log_id INTEGER REFERENCES spray_logs(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL, original_name VARCHAR(255),
  mime_type VARCHAR(50), size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crew members assigned to a specific spray log
CREATE TABLE IF NOT EXISTS spray_log_members (
  id SERIAL PRIMARY KEY,
  spray_log_id INTEGER REFERENCES spray_logs(id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(id),
  employee_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed
INSERT INTO admins (name, pin_hash, role) VALUES ('Admin', '$2a$10$placeholder', 'owner');
INSERT INTO crews (name) VALUES ('Crew A'), ('Crew B');
INSERT INTO equipment (name, type) VALUES
  ('4 Gal Backpack Sprayer','Backpack'),('Stihl SG 20 Backpack','Backpack'),
  ('25 Gal Skid Sprayer (Truck)','Truck Mount'),('50 Gal Skid Sprayer (Truck)','Truck Mount'),
  ('100 Gal Skid Sprayer (Truck)','Truck Mount'),('Z-Spray Ride-On','Ride-On'),
  ('Lesco HPS Spreader/Sprayer','Ride-On'),('Hand Pump Sprayer — 2 Gal','Hand');
INSERT INTO vehicles (name, pin_hash, crew_name) VALUES ('Truck 1', '$2a$10$placeholder', 'Crew A');
INSERT INTO chemicals (name,type,epa,active_ingredient,signal_word,restricted,sds_url,label_url,wx_temp,wx_humidity,wx_wind,wx_conditions) VALUES
  ('Barricade 4FL','Pre-Emergent Herbicide','100-1139','Prodiamine 40.7%','CAUTION',false,'https://www.greencastonline.com/labels/barricade-4fl','https://www.greencastonline.com/labels/barricade-4fl','{"op":">","value":90,"warn":"Do not apply above 90°F — reduced efficacy"}',NULL,'{"op":">","value":10,"warn":"Do not apply above 10 mph — drift risk"}',NULL),
  ('Trimec Classic','Post-Emergent Herbicide','2217-798','2,4-D + Mecoprop-p + Dicamba','DANGER',false,'https://www.pbigordonturf.com/products/herbicides/selective-herbicides/trimec-professional-lawn-care-broadleaf-weed-killer/','https://www.pbigordonturf.com/products/herbicides/selective-herbicides/trimec-professional-lawn-care-broadleaf-weed-killer/','{"op":">","value":85,"warn":"Risk of turf injury above 85°F"}',NULL,'{"op":">","value":10,"warn":"Do not apply above 10 mph — drift risk"}','{"op":"==","value":"Overcast","warn":"Reduced uptake in overcast / low-light"}'),
  ('Ammonium Sulfate 21-0-0','Fertilizer','N/A','21% Nitrogen, 24% Sulfur','CAUTION',false,NULL,NULL,'{"op":">","value":95,"warn":"Risk of burn above 95°F — water in immediately"}',NULL,NULL,NULL),
  ('Talstar P','Insecticide','279-3206','Bifenthrin 7.9%','CAUTION',true,'https://labelsds.com/images/user_uploads/Talstar%20Prof%20SDS%202-14-23.PDF','https://www.fmcprofessionalsolutions.com/specialty-products/talstar-professional/',NULL,NULL,'{"op":">","value":10,"warn":"Do not apply above 10 mph"}','{"op":"==","value":"Overcast","warn":"Apply during calm, clear conditions when possible"}'),
  ('Roundup Pro Max','Non-Selective Herbicide','524-579','Glyphosate 48.7%','WARNING',false,'https://www.backedbybayer.com/pest-management/roundup-pro-max','https://www.backedbybayer.com/pest-management/roundup-pro-max',NULL,'{"op":"<","value":30,"warn":"Low humidity reduces absorption — best above 40% RH"}','{"op":">","value":10,"warn":"Do not apply above 10 mph — drift kills non-target plants"}',NULL),
  ('Prodiamine 65 WDG','Pre-Emergent Herbicide','62719-416','Prodiamine 65%','CAUTION',false,NULL,NULL,NULL,NULL,'{"op":">","value":10,"warn":"Do not apply above 10 mph"}',NULL),
  ('Dismiss NXT','Post-Emergent Herbicide','279-9630','Sulfentrazone + Imazethapyr','CAUTION',false,NULL,NULL,NULL,NULL,'{"op":">","value":10,"warn":"Do not apply above 10 mph"}','{"op":"==","value":"Overcast","warn":"Best applied in full sun for maximum uptake"}'),
  ('Surfactant (Non-Ionic)','Adjuvant','N/A','80% Non-ionic surfactant','CAUTION',false,NULL,NULL,NULL,NULL,NULL,NULL),
  ('MSO Methylated Seed Oil','Adjuvant','N/A','Methylated seed oil','CAUTION',false,NULL,NULL,NULL,NULL,NULL,NULL),
  ('Marker Dye Blue','Indicator Dye','N/A','Colorant','CAUTION',false,NULL,NULL,NULL,NULL,NULL,NULL);

CREATE INDEX IF NOT EXISTS idx_spray_logs_created ON spray_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spray_logs_vehicle ON spray_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_spray_log_products_log ON spray_log_products(spray_log_id);
CREATE INDEX IF NOT EXISTS idx_spray_log_photos_log ON spray_log_photos(spray_log_id);
CREATE INDEX IF NOT EXISTS idx_spray_log_members_log ON spray_log_members(spray_log_id);
CREATE INDEX IF NOT EXISTS idx_employees_crew ON employees(default_crew_id);
