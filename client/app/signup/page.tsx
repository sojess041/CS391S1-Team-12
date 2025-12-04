"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { DIETARY_RESTRICTIONS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
/* Implemented signup logic to the same page as UI, but I can create a separate actions page for server actions if necessary */

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
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      alert("Please use your BU email address ending with @bu.edu.");
      return;
    }

    if (form.password !== form.confirm) {
      alert("Passwords do not match");
      return;
    }

    if (!form.role) {
      alert("Please select an account type");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            role: form.role,
            food_restrictions: form.foodRestrictions,
          },
        },
      });

      if (error) {
        alert("Error creating account: " + error.message);
        console.error(error);
        return;
      }

      alert("Account created! Please check your email to confirm your account.");
      console.log("Supabase signUp data:", data);

      router.push("/login");
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-3xl border border-gray-200 rounded-xl shadow-md p-10 sm:p-16 mx-auto mt-12">
      <h1 className="text-3xl font-semibold text-center">
        Sign Up for Spark<span className="text-red-600">!Bytes</span>
      </h1>
      <p className="italic text-center mt-2">
        Welcome to Spark!Bytes! Please create an account to reserve food and post events.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {/* Name */}
        <div className="w-full">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            placeholder="Full Name"
            required
          />
        </div>

        {/* Email */}
        <div className="w-full">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            BU Email Address <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            placeholder="BU Email Address"
            autoComplete="email"
            required
          />
        </div>

        {/* Password */}
        <div className="w-full">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none"
              placeholder="Password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto p-1 text-gray-600"
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="w-full">
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm"
              name="confirm"
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none"
              placeholder="Confirm Password"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute inset-y-0 right-2 my-auto p-1 text-gray-600"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Role */}
        <fieldset className="w-full">
          <legend className="block text-sm font-semibold text-gray-800 mb-2">
            Account Type<span className="text-red-600">*</span>
          </legend>
          <div className="flex items-center gap-6 text-gray-800">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="role"
                value="student"
                checked={form.role === "student"}
                onChange={() => setForm((prev) => ({ ...prev, role: "student" }))}
                className="h-4 w-4 border-gray-300"
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
                className="h-4 w-4 border-gray-300"
              />
              Event Organizer
            </label>
          </div>
        </fieldset>

        {/* Dietary Restrictions */}
        <fieldset className="w-full">
          <legend className="block text-sm font-semibold text-gray-800 mb-2">
            Dietary Restrictions{" "}
            <span className="text-sm font-normal text-gray-600">(Optional - Select all that apply)</span>
          </legend>
          <p className="text-xs text-gray-600 mb-3">
            We&#39;ll filter events to show only those that match your dietary needs. Leave blank to see all events.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DIETARY_RESTRICTIONS.map((option) => (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="foodRestriction"
                  value={option.value}
                  checked={form.foodRestrictions.includes(option.value)}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
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

        <p className="text-center mt-6 text-sm text-gray-700">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-red-600 hover:text-red-700 underline underline-offset-4">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
