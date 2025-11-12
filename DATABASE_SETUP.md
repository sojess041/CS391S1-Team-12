# Database Setup Complete

## What Was Implemented

### 1. Database Schema (client/supabase/schema.sql)
- users table with food_restrictions array field
- events table with event_tags array field
- reservations table
- Row Level Security (RLS) policies
- Indexes for performance
- Automatic timestamp updates

### 2. Food Restrictions Feature
- Users can specify dietary restrictions during signup
- Events are filtered based on user restrictions
- If user has restrictions (e.g., vegetarian), they only see events with matching tags
- If event has dietary tags (e.g., vegetarian), all users with that restriction can see it
- Users with no restrictions see all events
- Events with no dietary tags are visible to everyone

### 3. Code Structure
- Supabase client setup (lib/supabase.ts)
- Database helper functions (lib/db.ts) with filtering logic
- TypeScript types (types/database.ts)
- Updated signup form with dietary restrictions checkboxes
- Constants file for dietary restrictions

## Next Steps

### 1. Set Up Environment Variables
Create `.env.local` in the `client` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://exzflisfpzytbqydausf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4emZsaXNmcHp5dGJxeWRhdXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTI1NDMsImV4cCI6MjA3ODA4ODU0M30.hVcTso8RXwoU1kapvxNU6J9y6LONAtx6XJ7hKVjompQ
```

### 2. Run Database Schema
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project (exzflisfpzytbqydausf)
3. Navigate to SQL Editor
4. Copy and paste the contents of client/supabase/schema.sql
5. Click Run to execute the schema

### 3. Integrate Database Functions
The following functions are ready to use in your components:

Get events (with filtering):
```typescript
import { getEvents } from '@/lib/db';
const events = await getEvents(userId); // Pass userId if logged in
```

Search events:
```typescript
import { searchEvents } from '@/lib/db';
const events = await searchEvents(searchQuery, userId);
```

Create user:
```typescript
import { upsertUser } from '@/lib/db';
const user = await upsertUser({
  id: authUser.id,
  full_name: form.name,
  email: form.email,
  role: form.role,
  food_restrictions: form.foodRestrictions,
});
```

Create event:
```typescript
import { createEvent } from '@/lib/db';
const event = await createEvent({
  organizer_id: userId,
  event_name: formData.eventName,
  // ... other fields
  event_tags: formData.eventTags?.split(',').map(t => t.trim()) || [],
});
```

## How Food Restrictions Work

### User Side:
- User selects dietary restrictions during signup (e.g., `['vegetarian', 'vegan']`)
- Stored in `users.food_restrictions` as a text array

### Event Side:
- Organizer adds tags when creating event (e.g., `['vegetarian', 'halal', 'warm']`)
- Stored in `events.event_tags` as a text array

### Filtering Logic:
1. User with restrictions -> Only sees events where event_tags overlaps with food_restrictions
2. User without restrictions -> Sees all events
3. Event with no dietary tags -> Visible to everyone
4. Event with dietary tags -> Only visible to users with matching restrictions

### Example:
- User A has restrictions: ['vegetarian']
- Event 1 has tags: ['vegetarian', 'warm'] -> User A sees it
- Event 2 has tags: ['halal', 'spicy'] -> User A doesn't see it
- Event 3 has tags: [] (no dietary tags) -> User A sees it

## Files Created/Modified

### New Files:
- `client/supabase/schema.sql` - Database schema
- `client/supabase/README.md` - Setup instructions
- `client/lib/supabase.ts` - Supabase client
- `client/lib/supabase-server.ts` - Server-side client
- `client/lib/db.ts` - Database helper functions
- `client/lib/constants.ts` - Dietary restriction constants
- `client/types/database.ts` - Database TypeScript types

### Modified Files:
- `client/app/signup/page.tsx` - Added dietary restrictions UI
- `client/types/form.ts` - Added SignUpFormData type
- `client/package.json` - Added @supabase/supabase-js dependency

## Testing the Food Restrictions Feature

1. Sign up as a user with dietary restrictions (e.g., select "Vegetarian")
2. Create an event with tags including "vegetarian"
3. Log in as that user and verify they see the event
4. Create another event without "vegetarian" tag
5. Verify the user doesn't see the second event (if they only have vegetarian restriction)

## Notes

- The filtering happens in JavaScript after fetching events (for flexibility)
- For better performance at scale, consider moving filtering to SQL using PostgreSQL array operators
- Dietary restrictions are optional - users can leave them blank to see all events
- Event tags can include both dietary restrictions and descriptive tags (e.g., 'warm', 'sweet')

