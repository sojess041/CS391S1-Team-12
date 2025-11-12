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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can read other users' basic info (for organizer names, etc.)
CREATE POLICY "Users can read other users basic info" ON public.users
  FOR SELECT USING (true);

-- Events policies
-- Anyone can read active events
CREATE POLICY "Anyone can read active events" ON public.events
  FOR SELECT USING (is_active = true);

-- Only organizers can create events
CREATE POLICY "Organizers can create events" ON public.events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'organizer'
    )
  );

-- Organizers can update their own events
CREATE POLICY "Organizers can update own events" ON public.events
  FOR UPDATE USING (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'organizer'
    )
  );

-- Organizers can delete their own events
CREATE POLICY "Organizers can delete own events" ON public.events
  FOR DELETE USING (
    organizer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'organizer'
    )
  );

-- Reservations policies
-- Users can read their own reservations
CREATE POLICY "Users can read own reservations" ON public.reservations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create reservations for themselves
CREATE POLICY "Users can create own reservations" ON public.reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reservations
CREATE POLICY "Users can update own reservations" ON public.reservations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own reservations
CREATE POLICY "Users can delete own reservations" ON public.reservations
  FOR DELETE USING (auth.uid() = user_id);

