-- Seed Data: Adam's Asia Summer '26 Trip
-- Run this in Supabase SQL Editor after running schema.sql

-- 1. Create the trip
INSERT INTO trips (id, name, start_date, end_date, cover_city)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Asia Summer ''26',
  '2026-05-24',
  '2026-06-13',
  'Hanoi'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Itinerary segments
INSERT INTO itinerary_segments (id, trip_id, country, city, start_date, end_date, flag, nights, country_code, sort_order) VALUES
  ('i1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Japan', 'Tokyo', '2026-05-24', '2026-05-29', '🇯🇵', 5, 'JP', 1),
  ('i2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Vietnam', 'Hanoi', '2026-05-29', '2026-06-02', '🇻🇳', 4, 'VN', 2),
  ('i3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Thailand', 'Chiang Mai', '2026-06-02', '2026-06-04', '🇹🇭', 2, 'TH', 3),
  ('i4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Thailand', 'Bangkok', '2026-06-04', '2026-06-07', '🇹🇭', 3, 'TH', 4),
  ('i5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Indonesia', 'Phi Phi Islands', '2026-06-07', '2026-06-09', '🇮🇩', 2, 'ID', 5),
  ('i6', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Indonesia', 'Ubud', '2026-06-09', '2026-06-11', '🇮🇩', 2, 'ID', 6),
  ('i7', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Indonesia', 'Uluwatu', '2026-06-11', '2026-06-13', '🇮🇩', 2, 'ID', 7)
ON CONFLICT (id) DO NOTHING;

-- 3. Flights
INSERT INTO flights (id, trip_id, "from", from_code, "to", to_code, from_flag, to_flag, date, dep, arr, airline, status, seats, cost) VALUES
  ('f1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Toronto', 'YYZ', 'Tokyo', 'NRT', '🇨🇦', '🇯🇵', '2026-05-24', '10:00am', '4:25pm+1', 'Air Canada', 'Booked', '{"Adam": "—", "Kate": "—", "Vienna": "—", "You": "—"}', 770),
  ('f2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tokyo', 'NRT', 'Hanoi', 'HAN', '🇯🇵', '🇻🇳', '2026-05-29', '10:45am', '6:40pm', 'Vietnam Airlines', 'Booked', '{}', 450),
  ('f3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hanoi', 'HAN', 'Chiang Mai', 'CNX', '🇻🇳', '🇹🇭', '2026-06-02', '10:35am', '2:50pm', 'Thai AirAsia', 'Booked', '{}', 100),
  ('f4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chiang Mai', 'CNX', 'Bangkok', 'BKK', '🇹🇭', '🇹🇭', '2026-06-04', '9:10pm', '10:30pm', 'Thai AirAsia', 'Booked', '{"Adam": "44H", "Kate": "44J"}', 80),
  ('f5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Bangkok', 'BKK', 'Bali / Kuta', 'DPS', '🇹🇭', '🇮🇩', '2026-06-07', '12:40pm', '6:00pm', 'AirAsia', 'Booked', '{}', 140),
  ('f6', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Bali / Kuta', 'DPS', 'Toronto', 'YYZ', '🇮🇩', '🇨🇦', '2026-06-13', '4:30pm', '—', 'Connecting', 'Need to Book', '{}', NULL)
ON CONFLICT (id) DO NOTHING;

-- 4. Stays
INSERT INTO stays (id, trip_id, city, country, flag, check_in, check_out, name, type, status, booked_by, cost_per_night, nights, link, confirmation_link) VALUES
  ('s1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tokyo', 'Japan', '🇯🇵', '2026-05-24', '2026-05-29', 'The Millennials Shibuya', 'Hostel', 'Booked', 'Kate', 171, 5, 'https://www.hostelworld.com', 'https://booking.com/confirmation/123'),
  ('s2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hanoi', 'Vietnam', '🇻🇳', '2026-05-29', '2026-06-02', 'Motorventures Tour', 'Tour Included', 'Booked', 'Vienna', 25, 4, 'https://motorventures.com', NULL),
  ('s3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chiang Mai', 'Thailand', '🇹🇭', '2026-06-02', '2026-06-04', 'Wannamas Boutique House', 'Hostel', 'Need to Book', NULL, 30, 2, NULL, NULL),
  ('s4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Bangkok', 'Thailand', '🇹🇭', '2026-06-04', '2026-06-07', 'Revolution Khao San', 'Hostel', 'Need to Book', NULL, 30, 3, NULL, NULL),
  ('s5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Phi Phi Islands', 'Indonesia', '🇮🇩', '2026-06-07', '2026-06-09', 'Phi Phi Island Cabana Hotel', 'Hotel', 'Need to Book', NULL, 45, 2, NULL, NULL),
  ('s6', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ubud', 'Indonesia', '🇮🇩', '2026-06-09', '2026-06-11', 'Kupu Kupu Private Villa', 'Villa', 'Need to Book', NULL, 80, 2, NULL, NULL),
  ('s7', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Uluwatu', 'Indonesia', '🇮🇩', '2026-06-11', '2026-06-13', 'TBD Villa', 'Villa', 'Need to Book', NULL, 80, 2, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 5. Activities
INSERT INTO activities (id, trip_id, city, country, flag, name, date, cost, status, link, booked_by, individual) VALUES
  ('a1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tokyo', 'Japan', '🇯🇵', 'Tokyo Giants Baseball Game', '2026-05-25', 60, 'Considering', 'https://www.giants.jp/en/', NULL, false),
  ('a2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tokyo', 'Japan', '🇯🇵', 'Sumo Wrestling Tournament', '2026-05-26', 45, 'Booked', 'https://www.sumo.or.jp/En/', 'Adam', false),
  ('a3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tokyo', 'Japan', '🇯🇵', 'Shibuya Sky Tower', '2026-05-27', 22, 'Booked', 'https://www.shibuya-scramble-square.com/sky/', 'Kate', false),
  ('a4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tokyo', 'Japan', '🇯🇵', 'teamLab Borderless', '2026-05-28', 32, 'Booked', 'https://www.teamlab.art/e/borderless-azabudai/', 'Vienna', false),
  ('a5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hanoi', 'Vietnam', '🇻🇳', 'Ha Giang Loop Motorbike Tour (3 days)', '2026-05-30', 180, 'Booked', 'https://motorventures.com/', 'Vienna', false),
  ('a6', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chiang Mai', 'Thailand', '🇹🇭', 'Elephant Sanctuary Half-Day', '2026-06-03', 85, 'Considering', 'https://www.elephantnaturepark.org/', NULL, false),
  ('a7', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Bangkok', 'Thailand', '🇹🇭', 'Muay Thai Fight Night', '2026-06-05', 40, 'Considering', 'https://www.rajadamnern.com/', NULL, false),
  ('a8', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Phi Phi Islands', 'Indonesia', '🇮🇩', 'Sunset Boat Tour', '2026-06-08', 55, 'Considering', 'https://phi-phi.com/tours/', NULL, false),
  ('a9', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ubud', 'Indonesia', '🇮🇩', 'Sacred Monkey Forest', '2026-06-09', 8, 'Considering', 'https://monkeyforestubud.com/', NULL, false),
  ('a10', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Uluwatu', 'Indonesia', '🇮🇩', 'Kecak Fire Dance', '2026-06-12', 18, 'Considering', 'https://www.pura-luhur-uluwatu.com/', NULL, false)
ON CONFLICT (id) DO NOTHING;

-- 6. Notes
INSERT INTO notes (id, trip_id, type, icon, author, content) VALUES
  ('n1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Allergy', '🚨', 'Adam', 'Shellfish allergy — avoid shrimp/crab dishes'),
  ('n2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Preference', '🌿', 'Kate', 'Vegetarian-friendly options needed in every city'),
  ('n3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Goal', '🎯', 'Vienna', 'Wants to try local street food markets every city'),
  ('n4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Visa', '📋', 'All', 'Vietnam requires visa on arrival — apply e-visa minimum 3 days in advance'),
  ('n5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Health', '💊', 'All', 'Malaria prophylaxis recommended for Vietnam & Indonesia')
ON CONFLICT (id) DO NOTHING;

-- 7. Expenses
INSERT INTO expenses (id, trip_id, description, amount, currency, paid_by, split, date, category) VALUES
  ('e1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Tokyo Hostel (5 nights × 4 pax)', 3420, 'CAD', 'Kate', ARRAY['Adam', 'Kate', 'Vienna', 'You'], '2026-05-24', 'Stay'),
  ('e2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Ha Giang Loop Tour', 720, 'CAD', 'Vienna', ARRAY['Adam', 'Kate', 'Vienna', 'You'], '2026-05-30', 'Activity'),
  ('e3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CNX → BKK Flights', 560, 'CAD', 'Adam', ARRAY['Adam', 'Kate', 'Vienna', 'You'], '2026-06-04', 'Flight')
ON CONFLICT (id) DO NOTHING;

-- 8. Buddies
INSERT INTO buddies (trip_id, name, avatar, color, role) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Adam', 'A', '#3B82F6', 'editor'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kate', 'K', '#10B981', 'editor'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Vienna', 'V', '#8B5CF6', 'editor'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'You', 'Y', '#F59E0B', 'editor');
