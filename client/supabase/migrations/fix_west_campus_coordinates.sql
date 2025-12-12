-- Fix West Campus coordinates
-- Update The Fresh Food Co. at West Campus to correct coordinates
UPDATE public.locations
SET lat = 42.3505, lng = -71.1025
WHERE slug = 'west-campus' OR name LIKE '%West Campus%';

