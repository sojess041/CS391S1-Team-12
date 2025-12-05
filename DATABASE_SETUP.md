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

### 3. Server-Side Filtering Helper
- `public.get_visible_events` Postgres function enforces dietary restriction logic directly in SQL
- Optional search term filtering is baked in, so API consumers get consistent results whether browsing or searching
- Organizer contact info is joined in the function, meaning the UI only needs one round-trip per listing

### 4. Code Structure
- Supabase client setup (lib/supabase.ts)
- Database helper functions (lib/db.ts) with filtering logic
- TypeScript types (types/database.ts)
- Updated signup form with dietary restrictions checkboxes
- Constants file for dietary restrictions

## Next Steps

### 1. Set Up Environment Variables
Create `.env.local` in the `client` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

To get these values:
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings > API
4. Copy the "Project URL" and "anon public" key

### 2. Run Database Schema
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy and paste the contents of `client/supabase/schema.sql`
5. Click Run to execute the schema (rerun whenever this file changes so Supabase picks up helpers like `get_visible_events`)

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

- Dietary filtering + search now run in SQL via `public.get_visible_events`, which keeps payloads small and results consistent
- Dietary restrictions are optional - users can leave them blank to see all events
- Event tags can include both dietary restrictions and descriptive tags (e.g., 'warm', 'sweet')
- Re-run the schema SQL whenever you update `client/supabase/schema.sql` so Supabase stays in sync
