# Spark!Bytes
Spark!Bytes is a site made by BU students to help reduce food waste and feed the BU community.
Spark!Bytes connects hungry students with leftover event food in real time. Browse upcoming food events across campus, claim portions before they’re gone, or post your own event to share leftovers. Whether it’s post-hackathon pizza or extra bagels from a meeting, Spark!Bytes makes sure good food never goes to waste. 

## Features
- User authentication (sign up, log in)
- Event listing and posting
- Responsive UI with reusable components
- Supabase integration for database and authentication
  
## Getting Started
1. **Clone the repository:**
	```bash
	git clone https://github.com/sojess041/CS391S1-Team-12.git
	cd CS391S1-Team-12/client
	```
2. **Install dependencies:**
	```bash
	npm install
	```
3. Create a `.env.local` file in the `client` directory with the following:

	```env
	NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
	NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
	```

	To get these values:
	  1. Go to your Supabase dashboard: https://supabase.com/dashboard
 	 2. Select your project
 	 3. Go to Settings > API
 	 4. Copy the "Project URL" and "anon public" key

	Database Schema Setup:

	1. Go to your Supabase project dashboard: https://supabase.com/dashboard
	2. Navigate to the SQL Editor
	3. Copy and paste the contents of `schema.sql`
	4. Run the SQL script to create all tables, indexes, and RLS policies

4. **Run the development server:**
	```bash
	npm run dev
	```
	The app will be available at [http://localhost:3000](http://localhost:3000).

## Database Setup
See `DATABASE_SETUP.md` and `client/supabase/schema.sql` for details on the database schema and setup instructions.
