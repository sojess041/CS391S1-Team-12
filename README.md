# Spark!Bytes

Spark!Bytes is a site made by BU students to help reduce food waste and feed the BU community. Spark!Bytes connects hungry students with leftover event food in real time. Browse upcoming food events across campus, claim portions before they're gone, or post your own event to share leftovers. Whether it's post-hackathon pizza or extra bagels from a meeting, Spark!Bytes makes sure good food never goes to waste.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Maps:** Leaflet + React Leaflet (OpenStreetMap)
- **Backend & Auth:** Supabase (PostgreSQL, RLS, Supabase Auth)
- **Storage:** Supabase Storage for event images
- **Animations:** Framer Motion, Canvas Confetti
- **Icons:** React Icons

## Features

- User authentication (sign up, log in)
- Event listing and posting (organizers only)
- Interactive campus map with event locations
- Real-time event browsing and filtering
- Portion claiming/reservations
- Dark mode support
- Responsive UI with reusable components
- Google Maps integration for location links
- Event editing for organizers
- Dietary restriction filtering

## How It Works (User Flow)

1. **Sign up / log in** with your BU email and select your role (student or organizer).
2. **Browse upcoming events** on the list or interactive map.
3. **Filter by dietary restrictions** - events automatically match your preferences.
4. **Claim portions** to let hosts know how many people to expect.
5. **Post your own event** (organizers only) with time, location, and estimated servings.
6. **Edit your events** - organizers can update event details anytime.
7. **View your reservations** in your profile to keep track of upcoming pickups.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sojess041/CS391S1-Team-12.git
   cd CS391S1-Team-12/client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Then fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   To get these values:
   1. Go to your [Supabase dashboard](https://supabase.com/dashboard)
   2. Select your project
   3. Go to Settings > API
   4. Copy the "Project URL" and "anon public" key

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at [http://localhost:3000](http://localhost:3000).

## Full Setup Guide

Complete setup requires configuring the database, storage, and email confirmation:

- **[Database Setup](./DATABASE_SETUP.md)** – tables, schema, and RLS policies
- **[Email Confirmation Setup](./EMAIL_CONFIRMATION_SETUP.md)** – how to configure auth emails
- **[Storage Setup](./STORAGE_SETUP.md)** – for event images / uploads

See `client/supabase/schema.sql` for the complete database schema.

## Project Structure

```
client/
  app/                    # Next.js app router pages
    page.tsx              # Landing page
    events/
      page.tsx            # Events list
      [id]/
        page.tsx          # Event detail
        edit/
          page.tsx        # Edit event form
    post/
      page.tsx            # Create event form
    map/
      page.tsx            # Campus map
    profile/
      page.tsx            # User profile
    login/
      page.tsx            # Login page
    signup/
      page.tsx            # Signup page
  components/              # React components
    event-card.tsx         # Event card component
    navbar.tsx             # Navigation bar
    campus-map.tsx         # Map wrapper
    modal.tsx              # Modal component
    theme-toggle.tsx       # Dark mode toggle
  lib/                     # Utilities and helpers
    supabase.ts            # Supabase client
    db.ts                  # Database functions
    theme-provider.tsx     # Theme context
    constants.ts           # App constants
  types/                   # TypeScript type definitions
    database.ts            # Database types
    event.ts               # Event types
  supabase/
    schema.sql             # Database schema
    migrations/            # SQL migration files
  public/                  # Static assets
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions. The app is ready to deploy to Vercel, Netlify, or any platform that supports Next.js.

**Quick Deploy to Vercel:**
1. Push code to GitHub
2. Import project in Vercel
3. Set root directory to `client`
4. Add environment variables
5. Deploy!

## Future Work / Planned Features

- **Advanced filtering & search** - Filter events by building, time window, dietary tags
- **Map improvements** - Cluster markers, color-code by status (now/upcoming/ended)
- **Notifications** - Email alerts for new events near favorite buildings
- **Host dashboard** - See claim counts, mark events as "almost gone/gone"
- **Analytics** - Track events posted, portions claimed, food saved estimates
- **Mobile app** - Native mobile experience for on-the-go access

## Contributing

This is a class project for CS391S1 at Boston University. For questions or issues, please open an issue on GitHub.

## License

All rights reserved.
