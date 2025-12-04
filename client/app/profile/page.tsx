"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        router.replace("/login");
        return;
      }
      setEmail(userData.user.email ?? null);
      setRole(userData.user.user_metadata?.role ?? null);
      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 shadow-sm p-6 bg-white">
        <h1 className="text-2xl font-semibold mb-2">Profile</h1>
        <p className="text-sm text-gray-700">Email: {email}</p>
        <p className="text-sm text-gray-700">Role: {role ?? "N/A"}</p>
        <button
          className="mt-6 w-full rounded-lg bg-red-600 text-white font-semibold py-2 shadow-sm hover:shadow-md transition-shadow"
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
