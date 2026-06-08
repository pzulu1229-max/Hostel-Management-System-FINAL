-- Clear existing data
DELETE FROM blocked_rooms;
DELETE FROM allocations;
DELETE FROM rooms;

-- Insert 4-person rooms (K500)
INSERT INTO rooms (room_number, capacity, price) VALUES 
('A101', 4, 500),
('A102', 4, 500),
('A103', 4, 500),
('A104', 4, 500),
('A105', 4, 500),
('B201', 4, 500),
('B202', 4, 500),
('B203', 4, 500),
('B204', 4, 500),
('B205', 4, 500),
('C301', 4, 500),
('C302', 4, 500),
('C303', 4, 500),
('C304', 4, 500),
('C305', 4, 500),
('D401', 4, 500),
('D402', 4, 500),
('D403', 4, 500),
('D404', 4, 500),
('D405', 4, 500);

-- Insert 2-person rooms (K700)
INSERT INTO rooms (room_number, capacity, price) VALUES 
('E101', 2, 700),
('E102', 2, 700),
('E103', 2, 700),
('E104', 2, 700),
('E105', 2, 700);

-- Insert 2-person rooms (K900)
INSERT INTO rooms (room_number, capacity, price) VALUES 
('F201', 2, 900),
('F202', 2, 900),
('F203', 2, 900),
('F204', 2, 900),
('F205', 2, 900);

-- Insert 2-person rooms (K1000)
INSERT INTO rooms (room_number, capacity, price) VALUES 
('G301', 2, 1000),
('G302', 2, 1000),
('G303', 2, 1000),
('G304', 2, 1000),
('G305', 2, 1000);

-- Verify
SELECT COUNT(*) as total_rooms FROM rooms;
