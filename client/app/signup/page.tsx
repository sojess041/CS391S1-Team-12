"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { DIETARY_RESTRICTIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import Modal, { ModalType } from "@/components/modal";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "",
    foodRestrictions: [] as string[],
  });
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    message: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "foodRestriction") {
        setForm((prev) => {
          const restrictions = checked
            ? [...prev.foodRestrictions, value]
            : prev.foodRestrictions.filter((r) => r !== value);
          return { ...prev, foodRestrictions: restrictions };
        });
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check for BU email
    if (!form.email.endsWith("@bu.edu")) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Invalid Email",
        message: "Please use your BU email address ending with @bu.edu.",
      });
      alert("Please use your BU email address ending with @bu.edu.");
      return;
    }

    if (form.password !== form.confirm) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Password Mismatch",
        message: "Passwords do not match. Please try again.",
      });
      return;
    }

    if (!form.role) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Account Type Required",
        message: "Please select an account type (Student or Event Organizer).",
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: form.name,
            role: form.role,
            food_restrictions: form.foodRestrictions,
          },
        },
      });

      if (error) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Sign Up Failed",
          message: error.message,
        });
        alert("Error creating account: " + error.message);
        console.error(error);
        return;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        setModal({
          isOpen: true,
          type: "info",
          title: "Account Created!",
          message:
            "Your account has been created successfully!\n\n" +
            "Please check your email (including your spam/junk folder) to confirm your account before signing in.\n\n" +
            "If you don't receive an email within a few minutes, email confirmation may be disabled in Supabase settings, or you can manually confirm your account in the Supabase dashboard.",
        });
        // Redirect after modal is closed
        setTimeout(() => {
          router.push("/login");
        }, 100);
        return;
      }

      // If session exists, user is auto-confirmed (email confirmation disabled)
      const user = data.user;
      if (user?.id && user.email) {
        const resp = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            role: form.role,
            full_name: form.name,
            food_restrictions: form.foodRestrictions,
          }),
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          const msg = body?.error || "Failed to save profile";
          console.error("Profile creation error:", body);
          setModal({
            isOpen: true,
            type: "error",
            title: "Profile Creation Failed",
            message: msg,
          });
          return;
        }

        // Auto-login if email confirmation is disabled
        router.push("/profile");
      } else {
        router.push("/login");
      }
    } catch (err) {
      console.error(err);
      setModal({
        isOpen: true,
        type: "error",
        title: "Unexpected Error",
        message: "An unexpected error occurred. Please try again.",
      });
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const isValid = session?.user && (!session.expires_at || session.expires_at * 1000 > Date.now());

      if (isValid) {
        router.replace("/");
      } else {
        setCheckingAuth(false);
      }
    };

    checkSession();
  }, [router]);

  return (
    checkingAuth ? null : (
    <div className="w-full max-w-3xl border border-gray-200 dark:border-slate-700 rounded-xl shadow-md bg-white dark:bg-slate-800 p-10 sm:p-16 mx-auto mt-12 transition-colors duration-300">
      <h1 className="text-3xl font-semibold text-center text-gray-900 dark:text-slate-100">
        Sign Up for Spark<span className="text-red-600 dark:text-red-500">!Bytes</span>
      </h1>
      <p className="italic text-center mt-2 text-gray-600 dark:text-slate-400">
        Welcome to Spark!Bytes! Please create an account to reserve food and post events.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {/* Name */}
        <div className="w-full">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Full Name <span className="text-red-600 dark:text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
            placeholder="Full Name"
            required
          />
        </div>

        {/* Email */}
        <div className="w-full">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            BU Email Address <span className="text-red-600 dark:text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
            placeholder="BU Email Address"
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div className="w-full">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Password <span className="text-red-600 dark:text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
              placeholder="Password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto p-1 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="w-full">
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Confirm Password <span className="text-red-600 dark:text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400"
              placeholder="Confirm Password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto p-1 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-300"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Role */}
        <fieldset className="w-full">
          <legend className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2">
            Account Type<span className="text-red-600 dark:text-red-500">*</span>
          </legend>
          <div className="flex items-center gap-6 text-gray-800 dark:text-slate-300">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="student"
                checked={form.role === "student"}
                onChange={() => setForm((prev) => ({ ...prev, role: "student" }))}
                className="h-4 w-4 border-gray-300 dark:border-slate-600 text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900"
              />
              Student
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="organizer"
                checked={form.role === "organizer"}
                onChange={() => setForm((prev) => ({ ...prev, role: "organizer" }))}
                className="h-4 w-4 border-gray-300 dark:border-slate-600 text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900"
              />
              Event Organizer
            </label>
          </div>
        </fieldset>

        {/* Dietary Restrictions */}
        <fieldset className="w-full">
          <legend className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-2">
            Dietary Restrictions{" "}
            <span className="text-sm font-normal text-gray-600 dark:text-slate-400">(Optional - Select all that apply)</span>
          </legend>
          <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">
            We&#39;ll filter events to show only those that match your dietary needs. Leave blank to see all events.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DIETARY_RESTRICTIONS.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  name="foodRestriction"
                  value={option.value}
                  checked={form.foodRestrictions.includes(option.value)}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-red-600 dark:text-red-500 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Submit Button */}
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-red-600 text-white font-semibold py-2 shadow-sm hover:shadow-md transition-shadow"
        >
          Sign Up
        </button>

        <p className="text-center mt-6 text-sm text-gray-700 dark:text-slate-300">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 underline underline-offset-4">
            Log in
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
