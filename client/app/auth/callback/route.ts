import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/profile";

  if (code) {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.redirect(new URL("/login?error=configuration", request.url));
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
    }

    const user = data.session.user;

    // Check if user profile exists, create if not
    if (user.email && serviceRoleKey) {
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: existingUser } = await adminSupabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingUser) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.preferred_username ||
          user.email.split("@")[0];
        const role = user.user_metadata?.role || "student";

        await adminSupabase.from("users").insert({
          id: user.id,
          email: user.email,
          role: role,
          full_name: fullName,
          food_restrictions: user.user_metadata?.food_restrictions || [],
        });
      }
    }

    // Redirect to the requested page or profile
    return NextResponse.redirect(new URL(next, request.url));
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL("/login", request.url));
}

