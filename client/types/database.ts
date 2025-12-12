// Database types matching the Supabase schema

export type UserRole = 'student' | 'organizer';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export type DietaryRestriction = 
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  food_restrictions: DietaryRestriction[];
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  event_name: string;
  event_location: string;
  room_number: string | null;
  event_date: string;
  start_time: string;
  end_time: string;
  food_type: string;
  quantity: number;
  quantity_remaining: number;
  event_description: string | null;
  event_tags: string[];
  event_image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  user_id: string;
  event_id: string;
  quantity_reserved: number;
  reserved_at: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

// Helper type for event with organizer info
export interface EventWithOrganizer extends Event {
  organizer?: {
    full_name: string;
    email: string;
  };
}

export type FoodCategory = 
  | 'vegetarian'
  | 'vegan'
  | 'halal'
  | 'kosher'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'OTHER';

export interface Location {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  type: string;
  is_active: boolean;
}

