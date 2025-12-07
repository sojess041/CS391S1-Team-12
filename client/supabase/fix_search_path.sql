-- Fix search_path security issues for all functions
-- This prevents search_path injection attacks by explicitly setting the search_path

-- Fix get_visible_events function
CREATE OR REPLACE FUNCTION public.get_visible_events(
  user_id UUID DEFAULT NULL,
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  organizer_id UUID,
  event_name TEXT,
  event_location TEXT,
  room_number TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  start_time TIME,
  end_time TIME,
  food_type TEXT,
  quantity INTEGER,
  quantity_remaining INTEGER,
  event_description TEXT,
  event_tags TEXT[],
  event_image TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  organizer_full_name TEXT,
  organizer_email TEXT
)
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.organizer_id,
    e.event_name,
    e.event_location,
    e.room_number,
    e.event_date,
    e.start_time,
    e.end_time,
    e.food_type,
    e.quantity,
    e.quantity_remaining,
    e.event_description,
    e.event_tags,
    e.event_image,
    e.is_active,
    e.created_at,
    e.updated_at,
    organizer.full_name AS organizer_full_name,
    organizer.email AS organizer_email
  FROM public.events e
  JOIN public.users organizer ON organizer.id = e.organizer_id
  LEFT JOIN public.users u ON u.id = user_id
  WHERE e.is_active = TRUE
    AND (
      user_id IS NULL
      OR u.id IS NULL
      OR COALESCE(array_length(u.food_restrictions, 1), 0) = 0
      OR COALESCE(array_length(e.event_tags, 1), 0) = 0
      OR e.event_tags && u.food_restrictions
    )
    AND (
      search_term IS NULL
      OR e.event_name ILIKE '%' || search_term || '%'
      OR e.event_location ILIKE '%' || search_term || '%'
      OR e.food_type ILIKE '%' || search_term || '%'
      OR e.event_description ILIKE '%' || search_term || '%'
    )
  ORDER BY e.event_date ASC;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

-- Fix auto_archive_events function (from migration)
CREATE OR REPLACE FUNCTION public.auto_archive_events()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET status = 'ARCHIVED',
      is_active = FALSE,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE status IN ('UPCOMING', 'ONGOING')
    AND (event_date + end_time) < NOW();
END;
$$;

