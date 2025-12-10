"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { supabase } from "@/lib/supabase";
import Modal, { ModalType } from "@/components/modal";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: "error",
    message: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { email, password } = form;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Login Failed",
        message: error.message,
      });
      return;
    }

    // Check if user profile exists, create if not
    await ensureUserProfile();
    router.replace("/profile");
  };

  const ensureUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user profile exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();

    // If profile doesn't exist, create it
    if (!existingUser && user.email) {
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split("@")[0];
      const role = user.user_metadata?.role || "student";
      
      const resp = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          role: role,
          full_name: fullName,
          food_restrictions: user.user_metadata?.food_restrictions || [],
        }),
      });

      if (!resp.ok) {
        console.error("Failed to create user profile");
      }
    }
      alert(error.message);
      return;
    }

    router.replace("/profile");
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const isValid = session?.user && (!session.expires_at || session.expires_at * 1000 > Date.now());

      if (isValid) {
        router.replace("/profile");
      } else {
        setCheckingAuth(false);
      }
    };

    checkSession();
  }, [router]);

  return (
    checkingAuth ? null : (
    <div className="w-full max-w-3xl border border-gray-200 rounded-xl shadow-md p-10 sm:p-16 mx-auto mt-12">
      <h1 className="text-2xl font-semibold text-center">
        Log In to <span className="text-red-600">Spark</span>!Bytes
      </h1>
      <p className="italic text-center mt-2">Please log in to your account to reserve food and post events.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="w-full">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div className="w-full">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto p-1 text-gray-600"
            >
              {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300"
            />
            Remember me
          </label>
          <a href="#" className="text-sm text-gray-600 hover:text-gray-800 underline underline-offset-4">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-red-600 text-white font-semibold py-2 shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          className="mt-2 w-full rounded-lg bg-red-600 text-white font-semibold py-2 shadow-sm hover:shadow-md transition-shadow"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-center mt-5 text-sm text-gray-700">
          Don&#39;t have an account?{" "}
          <Link href="/signup" className="font-medium text-red-600 hover:text-red-700 underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </form>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </div>
    )
  );
}
