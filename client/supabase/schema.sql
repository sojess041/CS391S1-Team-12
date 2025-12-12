-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'organizer')),
  food_restrictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_location TEXT NOT NULL,
  room_number TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  food_type TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  quantity_remaining INTEGER NOT NULL CHECK (quantity_remaining >= 0),
  event_description TEXT,
  event_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  event_image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  quantity_reserved INTEGER NOT NULL CHECK (quantity_reserved > 0),
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON public.events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_event_tags ON public.events USING GIN(event_tags);
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON public.reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_event_id ON public.reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_users_food_restrictions ON public.users USING GIN(food_restrictions);

-- Helper function to fetch events visible to a specific user (enforces dietary filters server-side)
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

-- Function to update updated_at timestamp
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

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can insert their own profile (when signing up)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read other users' basic info (for organizer names, etc.)
DROP POLICY IF EXISTS "Users can read other users basic info" ON public.users;
CREATE POLICY "Users can read other users basic info" ON public.users
  FOR SELECT USING (true);

-- Events policies
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Anyone can read active events" ON public.events;
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON public.events;

CREATE POLICY "Anyone can read active events" ON public.events
  FOR SELECT USING (is_active = true);

CREATE POLICY "Organizers can create events" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'organizer'
    )
  );

CREATE POLICY "Organizers can update own events" ON public.events
  FOR UPDATE USING (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'organizer'
    )
  );

CREATE POLICY "Organizers can delete own events" ON public.events
  FOR DELETE USING (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'organizer'
    )
  );

-- Reservations policies
-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can read own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can create own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can update own reservations" ON public.reservations;
DROP POLICY IF EXISTS "Users can delete own reservations" ON public.reservations;

CREATE POLICY "Users can read own reservations" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reservations" ON public.reservations
  FOR DELETE USING (auth.uid() = user_id);

-- Helper function to reserve an event atomically
CREATE OR REPLACE FUNCTION public.reserve_event(event_id_input UUID, servings INTEGER DEFAULT 1)
RETURNS TABLE (reservation_id UUID, new_quantity_remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  authenticated_user UUID;
  updated_quantity INTEGER;
  inserted_reservation UUID;
BEGIN
  authenticated_user := auth.uid();
  IF authenticated_user IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to reserve events';
  END IF;

  IF servings IS NULL OR servings <= 0 THEN
    RAISE EXCEPTION 'Servings must be greater than zero';
  END IF;

  UPDATE public.events
  SET quantity_remaining = quantity_remaining - servings,
      updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = event_id_input
    AND quantity_remaining >= servings
    AND is_active = TRUE
  RETURNING quantity_remaining INTO updated_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event unavailable or not enough servings remaining';
  END IF;

  INSERT INTO public.reservations (user_id, event_id, quantity_reserved, status)
  VALUES (authenticated_user, event_id_input, servings, 'confirmed')
  RETURNING id INTO inserted_reservation;

  RETURN QUERY SELECT inserted_reservation, updated_quantity;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reserve_event(UUID, INTEGER) TO authenticated;
