-- Add icon field to services table and set default icons for existing services
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'wrench';

-- Update existing services with appropriate icons based on their names
UPDATE services 
SET icon = CASE 
  WHEN LOWER(name) LIKE '%bath%' OR LOWER(name) LIKE '%wash%' THEN 'droplets'
  WHEN LOWER(name) LIKE '%deshed%' OR LOWER(name) LIKE '%brush%' THEN 'scissors'
  WHEN LOWER(name) LIKE '%groom%' OR LOWER(name) LIKE '%full%' THEN 'sparkles'
  WHEN LOWER(name) LIKE '%nail%' OR LOWER(name) LIKE '%trim%' THEN 'activity'
  WHEN LOWER(name) LIKE '%teeth%' OR LOWER(name) LIKE '%dental%' THEN 'circle'
  ELSE 'wrench'
END
WHERE icon = 'wrench';

-- Make color nullable for backward compatibility (don't break existing data)
ALTER TABLE services 
ALTER COLUMN color DROP NOT NULL;
