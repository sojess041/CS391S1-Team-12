import { supabase } from './supabase';
import { Event, EventWithOrganizer, User, Reservation, DietaryRestriction } from '@/types/database';

// Helper function to check if arrays overlap (for food restriction filtering)
function arraysOverlap(arr1: string[], arr2: string[]): boolean {
  if (arr1.length === 0 || arr2.length === 0) return true;
  return arr1.some(item => arr2.includes(item));
}

// Get events filtered by user's food restrictions
export async function getEvents(userId?: string | null): Promise<EventWithOrganizer[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:users!events_organizer_id_fkey (
        full_name,
        email
      )
    `)
    .eq('is_active', true)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  let events = (data || []) as EventWithOrganizer[];

  // If user is logged in, filter by their food restrictions
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('food_restrictions')
      .eq('id', userId)
      .single();

    if (user && user.food_restrictions && user.food_restrictions.length > 0) {
      // Filter events where event_tags overlaps with user's food_restrictions
      // Show events that have at least one matching tag, or events with no dietary tags
      events = events.filter(event => {
        // If event has no tags, show it to everyone
        if (!event.event_tags || event.event_tags.length === 0) {
          return true;
        }
        // Check if any event tag matches any user restriction
        return arraysOverlap(event.event_tags, user.food_restrictions);
      });
    }
  }

  return events;
}

// Get a single event by ID
export async function getEventById(eventId: string): Promise<EventWithOrganizer | null> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:users!events_organizer_id_fkey (
        full_name,
        email
      )
    `)
    .eq('id', eventId)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return data as EventWithOrganizer;
}

// Search events by query string
export async function searchEvents(
  searchQuery: string,
  userId?: string | null
): Promise<EventWithOrganizer[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:users!events_organizer_id_fkey (
        full_name,
        email
      )
    `)
    .eq('is_active', true)
    .or(`event_name.ilike.%${searchQuery}%,event_location.ilike.%${searchQuery}%,food_type.ilike.%${searchQuery}%,event_description.ilike.%${searchQuery}%`)
    .order('event_date', { ascending: true });

  if (error) {
    console.error('Error searching events:', error);
    throw error;
  }

  let events = (data || []) as EventWithOrganizer[];

  // Apply food restriction filtering if user is logged in
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('food_restrictions')
      .eq('id', userId)
      .single();

    if (user && user.food_restrictions && user.food_restrictions.length > 0) {
      // Filter events where event_tags overlaps with user's food_restrictions
      events = events.filter(event => {
        // If event has no tags, show it to everyone
        if (!event.event_tags || event.event_tags.length === 0) {
          return true;
        }
        // Check if any event tag matches any user restriction
        return arraysOverlap(event.event_tags, user.food_restrictions);
      });
    }
  }

  return events;
}

// Create a new event
export async function createEvent(eventData: {
  organizer_id: string;
  event_name: string;
  event_location: string;
  room_number?: string;
  event_date: string;
  start_time: string;
  end_time: string;
  food_type: string;
  quantity: number;
  event_description?: string;
  event_tags?: string[];
  event_image?: string;
}): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      ...eventData,
      quantity_remaining: eventData.quantity,
      event_tags: eventData.event_tags || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return data as Event;
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data as User;
}

// Create or update user profile
export async function upsertUser(userData: {
  id: string;
  full_name: string;
  email: string;
  role: 'student' | 'organizer';
  food_restrictions?: DietaryRestriction[];
}): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      ...userData,
      food_restrictions: userData.food_restrictions || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    throw error;
  }

  return data as User;
}

// Update user's food restrictions
export async function updateUserFoodRestrictions(
  userId: string,
  foodRestrictions: DietaryRestriction[]
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ food_restrictions: foodRestrictions })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating food restrictions:', error);
    throw error;
  }

  return data as User;
}

// Create a reservation
export async function createReservation(reservationData: {
  user_id: string;
  event_id: string;
  quantity_reserved: number;
}): Promise<Reservation> {
  // First, check if event has enough quantity remaining
  const event = await getEventById(reservationData.event_id);
  if (!event) {
    throw new Error('Event not found');
  }

  if (event.quantity_remaining < reservationData.quantity_reserved) {
    throw new Error('Not enough quantity remaining');
  }

  // Create reservation
  const { data: reservation, error: reservationError } = await supabase
    .from('reservations')
    .insert({
      ...reservationData,
      status: 'pending',
    })
    .select()
    .single();

  if (reservationError) {
    console.error('Error creating reservation:', reservationError);
    throw reservationError;
  }

  // Update event quantity_remaining
  const { error: updateError } = await supabase
    .from('events')
    .update({
      quantity_remaining: event.quantity_remaining - reservationData.quantity_reserved,
    })
    .eq('id', reservationData.event_id);

  if (updateError) {
    console.error('Error updating event quantity:', updateError);
    throw updateError;
  }

  return reservation as Reservation;
}

// Get user's reservations
export async function getUserReservations(userId: string): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('user_id', userId)
    .order('reserved_at', { ascending: false });

  if (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }

  return (data || []) as Reservation[];
}

