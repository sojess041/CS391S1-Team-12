"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

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
      alert(error.message);
      return;
    }

    alert("Logged in successfully!");
    window.location.href = "/"; // redirect after login
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
  };

  return (
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
          className="mt-2 w-full rounded-lg bg-red-600 text-white font-semibold py-2 shadow-sm hover:shadow-md transition-shadow"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <div className="flex items-center w-full">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-4 text-sm text-gray-600">Or log in with</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <button
            type="button"
            onClick={signInWithGoogle}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <FcGoogle className="h-5 w-5" aria-hidden />
            Google
          </button>
          <button
            type="button"
            onClick={signInWithGithub}
            className="flex items-center justify-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 cursor-pointer"
          >
            <FaGithub className="h-5 w-5" aria-hidden />
            GitHub
          </button>
        </div>

        <p className="text-center mt-5 text-sm text-gray-700">
          Don't have an account?
          <Link href="/signup" className="font-medium text-red-600 hover:text-red-700 underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
