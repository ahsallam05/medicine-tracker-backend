-- ============================================================================
-- MOCK DATA SEED - Medicine Expiry Tracking System
-- Realistic sample data for testing and development
-- ============================================================================

-- ============================================================================
-- PHARMACISTS (5 accounts)
-- Password: "pharma123" (bcrypt hashed with 12 rounds)
-- ============================================================================

INSERT INTO users (name, username, password, role, is_active) VALUES
-- ('Default Administrator', 'admin', '$2a$12$Q0ByB.6YI2/OYrB4fQOYLe6QdRg6XnYlYqYqYqYqYqYqYqYqYqYqYqY', 'admin', TRUE)
('Ahmed Sallam', 'ahmed', '$2a$12$CITHeZ8an5s8s5Z7wT1/HOgWse194B6E5hf2BTrG39Y3rpB2anTsC', 'pharmacist', TRUE),
('Mohamed Ali', 'mohamed', '$2a$12$CITHeZ8an5s8s5Z7wT1/HOgWse194B6E5hf2BTrG39Y3rpB2anTsC', 'pharmacist', TRUE),
('Mostafa Ibrahim', 'mostafa', '$2a$12$CITHeZ8an5s8s5Z7wT1/HOgWse194B6E5hf2BTrG39Y3rpB2anTsC', 'pharmacist', TRUE),
('Ramez', 'ramez', '$2a$12$CITHeZ8an5s8s5Z7wT1/HOgWse194B6E5hf2BTrG39Y3rpB2anTsC', 'pharmacist', TRUE),
('Sayed Ali', 'sayed', '$2a$12$CITHeZ8an5s8s5Z7wT1/HOgWse194B6E5hf2BTrG39Y3rpB2anTsC', 'pharmacist', TRUE);

-- ============================================================================
-- MEDICINES (30 medicines)
-- Covers all alert scenarios: expired, critical, expiring soon, good, out of stock, running low
-- ============================================================================

-- ---------------------------------------------------------------------------
-- EXPIRED MEDICINES (5 items - expiry in the past)
-- ---------------------------------------------------------------------------

INSERT INTO medicines (name, quantity, expiry_date, category, created_by) VALUES
('Expired Panadol Extra', 50, CURRENT_DATE - INTERVAL '10 days', 'Painkiller', 1),
('Expired Amoxicillin 500mg', 0, CURRENT_DATE - INTERVAL '15 days', 'Antibiotic', 1),  -- Expired AND Out of Stock
('Expired Ibuprofen 400mg', 5, CURRENT_DATE - INTERVAL '20 days', 'Painkiller', 1),    -- Expired AND Running Low
('Expired Vitamin C 1000mg', 30, CURRENT_DATE - INTERVAL '5 days', 'Vitamin', 1),
('Expired Omeprazole 20mg', 0, CURRENT_DATE - INTERVAL '30 days', 'Antacid', 1);      -- Expired AND Out of Stock

-- ---------------------------------------------------------------------------
-- CRITICAL MEDICINES (5 items - expiry within 7 days)
-- ---------------------------------------------------------------------------

INSERT INTO medicines (name, quantity, expiry_date, category, created_by) VALUES
('Critical Paracetamol', 100, CURRENT_DATE + INTERVAL '2 days', 'Painkiller', 1),
('Critical Azithromycin', 0, CURRENT_DATE + INTERVAL '5 days', 'Antibiotic', 1),      -- Critical AND Out of Stock
('Critical Oseltamivir', 8, CURRENT_DATE + INTERVAL '3 days', 'Antiviral', 1),         -- Critical AND Running Low
('Critical Vitamin D3', 45, CURRENT_DATE + INTERVAL '7 days', 'Vitamin', 1),
('Critical Ranitidine', 3, CURRENT_DATE + INTERVAL '4 days', 'Antacid', 1);           -- Critical AND Running Low

-- ---------------------------------------------------------------------------
-- EXPIRING SOON MEDICINES (5 items - expiry within 8-30 days)
-- ---------------------------------------------------------------------------

INSERT INTO medicines (name, quantity, expiry_date, category, created_by) VALUES
('Expiring Aspirin', 80, CURRENT_DATE + INTERVAL '15 days', 'Painkiller', 1),
('Expiring Ciprofloxacin', 0, CURRENT_DATE + INTERVAL '20 days', 'Antibiotic', 1),     -- Expiring AND Out of Stock
('Expiring Acyclovir', 6, CURRENT_DATE + INTERVAL '25 days', 'Antiviral', 1),         -- Expiring AND Running Low
('Expiring Vitamin B Complex', 120, CURRENT_DATE + INTERVAL '30 days', 'Vitamin', 1),
('Expiring Pantoprazole', 2, CURRENT_DATE + INTERVAL '12 days', 'Antacid', 1);        -- Expiring AND Running Low

-- ---------------------------------------------------------------------------
-- GOOD STOCK MEDICINES (5 items - expiry far in the future)
-- ---------------------------------------------------------------------------

INSERT INTO medicines (name, quantity, expiry_date, category, created_by) VALUES
('Good Stock Diclofenac', 200, CURRENT_DATE + INTERVAL '180 days', 'Painkiller', 1),
('Good Stock Doxycycline', 150, CURRENT_DATE + INTERVAL '200 days', 'Antibiotic', 1),
('Good Stock Valacyclovir', 75, CURRENT_DATE + INTERVAL '150 days', 'Antiviral', 1),
('Good Stock Multivitamin', 500, CURRENT_DATE + INTERVAL '365 days', 'Vitamin', 1),
('Good Stock Esomeprazole', 100, CURRENT_DATE + INTERVAL '120 days', 'Antacid', 1);

-- ---------------------------------------------------------------------------
-- OUT OF STOCK MEDICINES (5 items - quantity = 0)
-- Some overlap with expired/critical/expiring above, remaining are good stock
-- ---------------------------------------------------------------------------

INSERT INTO medicines (name, quantity, expiry_date, category, created_by) VALUES
('Out of Stock Ketoprofen', 0, CURRENT_DATE + INTERVAL '90 days', 'Painkiller', 1),      -- Good expiry, no stock
('Out of Stock Clarithromycin', 0, CURRENT_DATE + INTERVAL '60 days', 'Antibiotic', 1),  -- Good expiry, no stock
('Out of Stock Zanamivir', 0, CURRENT_DATE + INTERVAL '100 days', 'Antiviral', 1),         -- Good expiry, no stock
('Out of Stock Vitamin E', 0, CURRENT_DATE + INTERVAL '240 days', 'Vitamin', 1),           -- Good expiry, no stock
('Out of Stock Lansoprazole', 0, CURRENT_DATE + INTERVAL '180 days', 'Antacid', 1);        -- Good expiry, no stock

-- ---------------------------------------------------------------------------
-- RUNNING LOW MEDICINES (5 items - quantity between 1-10)
-- Some overlap with expired/critical/expiring above, remaining are good stock
-- ---------------------------------------------------------------------------

INSERT INTO medicines (name, quantity, expiry_date, category, created_by) VALUES
('Low Stock Naproxen', 4, CURRENT_DATE + INTERVAL '200 days', 'Painkiller', 1),         -- Good expiry, low stock
('Low Stock Metronidazole', 7, CURRENT_DATE + INTERVAL '90 days', 'Antibiotic', 1),      -- Good expiry, low stock
('Low Stock Rimantadine', 2, CURRENT_DATE + INTERVAL '110 days', 'Antiviral', 1),        -- Good expiry, low stock
('Low Stock Vitamin B12', 9, CURRENT_DATE + INTERVAL '300 days', 'Vitamin', 1),          -- Good expiry, low stock
('Low Stock Famotidine', 1, CURRENT_DATE + INTERVAL '150 days', 'Antacid', 1);           -- Good expiry, low stock

-- ============================================================================
-- DATA SUMMARY:
-- - 5 Pharmacists (ahmed, mohamed, mostafa, ramez, sayed)
-- - 30 Medicines across 5 categories
-- 
-- ALERT COVERAGE:
-- - 5 Expired (including 2 that are also Out of Stock, 1 also Running Low)
-- - 5 Critical (including 1 that is also Out of Stock, 2 also Running Low)
-- - 5 Expiring Soon (including 1 that is also Out of Stock, 2 also Running Low)
-- - 5 Good Stock (healthy expiry, good quantity)
-- - 5 Out of Stock total (including overlaps with expired/critical/expiring)
-- - 5 Running Low total (including overlaps with expired/critical/expiring)
-- ============================================================================