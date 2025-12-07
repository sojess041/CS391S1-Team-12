import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key to bypass RLS for profile inserts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { id, email, role, full_name, food_restrictions } = payload || {};

    if (!id || !email || !role || !full_name) {
      return NextResponse.json(
        { error: `Missing required fields. Received: ${JSON.stringify({ id: !!id, email: !!email, role: !!role, full_name: !!full_name })}` },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected for new users
      console.error("Error checking existing user:", checkError);
      return NextResponse.json({ error: `Database error: ${checkError.message}` }, { status: 500 });
    }

    if (existingUser) {
      // User already exists, update instead of insert
      const { error: updateError } = await supabase
        .from("users")
        .update({
          email,
          role,
          full_name,
          food_restrictions: food_restrictions ?? [],
        })
        .eq("id", id);

      if (updateError) {
        console.error("Error updating user:", updateError);
        return NextResponse.json({ error: `Failed to update profile: ${updateError.message}` }, { status: 400 });
      }

      return NextResponse.json({ ok: true, message: "Profile updated" }, { status: 200 });
    }

    // Insert new user
    const { error } = await supabase.from("users").insert({
      id,
      email,
      role,
      full_name,
      food_restrictions: food_restrictions ?? [],
    });

    if (error) {
      console.error("Error inserting user:", error);
      // Provide more detailed error message
      let errorMessage = error.message;
      if (error.code === "23505") {
        errorMessage = "User with this email already exists";
      } else if (error.code === "23503") {
        errorMessage = "Invalid user reference. Please ensure you're signed up with Supabase Auth first.";
      } else if (error.code === "23514") {
        errorMessage = `Invalid data: ${error.message}`;
      }
      return NextResponse.json({ error: errorMessage, code: error.code }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error("Unexpected error in POST /api/users:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error occurred" }, { status: 500 });
  }
}
