"use client";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";

export default function Home() {
  const [eventInput, SetEventInput] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    SetEventInput(event.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col justify-content items-center">
      <main className="flex flex-col items-center justify-center p-24">
        <h1 className="font-semibold text-5xl leading-none tracking-normal text-center">
          Find Free Food Around Campus!
        </h1>
        <p className="font-normal italic text-2xl leading-none tracking-normal text-center mt-4">
          A site made by students, for students, to help reduce food waste.
        </p>
        <label className="relative mt-5 block w-full max-w-xl">
          <span className="sr-only">Search</span>
          <input
            type="text"
            value={eventInput}
            onChange={handleChange}
            id="eventInput"
            placeholder="Search..."
            className="w-full rounded-2xl border border-gray-300 bg-gray-200/60 px-5 py-2 pr-10 shadow-lg drop-shadow-lg focus:outline-none"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <FaSearch className="h-4 w-4" aria-hidden="true" />
          </span>
        </label>
      </main>
      <section className="w-full max-w-6xl mt-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"></div>
      </section>
    </div>
  );
}
