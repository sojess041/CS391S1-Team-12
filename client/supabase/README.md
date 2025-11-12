# Database Setup Instructions

## Environment Variables

Create a `.env.local` file in the `client` directory with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://exzflisfpzytbqydausf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4emZsaXNmcHp5dGJxeWRhdXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI1NDMsImV4cCI6MjA3ODA4ODU0M30.hVcTso8RXwoU1kapvxNU6J9y6LONAtx6XJ7hKVjompQ
```

## Database Schema Setup

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL script to create all tables, indexes, and RLS policies

## Food Restrictions Feature

The database supports food restrictions filtering:
- Users can have multiple food restrictions (e.g., ['vegetarian', 'vegan'])
- Events have tags that include dietary restrictions (e.g., ['vegetarian', 'halal'])
- Events are filtered based on user restrictions - users only see events that match at least one of their restrictions
- Users with no restrictions see all events
- Events with no dietary tags are visible to everyone

## Standard Dietary Restriction Tags

- `vegetarian`
- `vegan`
- `halal`
- `kosher`
- `gluten-free`
- `dairy-free`
- `nut-free`

Plus custom tags like 'warm', 'sweet', 'spicy', 'breakfast', etc.

