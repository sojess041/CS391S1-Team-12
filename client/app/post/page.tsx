"use client";
import Image from "next/image";
import { useState, FormEvent, ChangeEvent } from "react";
import { FormData } from "@/types/form";

const inputClasses =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-500 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition";

export default function Post() {
  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    eventLocation: "",
    roomNumber: "",
    eventDate: "",
    foodType: "",
    quantity: 0,
    eventDescription: "",
    eventTags: "",
    eventImage: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "quantity" ? Number(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="pointer-events-none absolute bottom-0 right-[80px] hidden md:block" aria-hidden="true">
        <Image src="/terrier_4.png" alt="Boston terriers" width={200} height={200} priority />
      </div>
      <div className="mx-auto flex w-11/12 max-w-4xl flex-col pb-12 pt-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-semibold text-gray-900">Post leftover food</h1>
          <p className="mt-3 text-xl italic text-gray-600">
            Share your event’s extra servings so classmates can swing by before it’s gone.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-sm"
        >
          <div className="w-full">
            <label htmlFor="eventName" className="text-sm font-semibold text-gray-900">
              Event name
            </label>
            <input
              id="eventName"
              name="eventName"
              type="text"
              placeholder="Hackathon showcase lunch"
              value={formData.eventName}
              onChange={handleChange}
              className={`${inputClasses} mt-2`}
            />
          </div>

          <div className="w-full">
            <label htmlFor="eventLocation" className="text-sm font-semibold text-gray-900">
              Location
            </label>
            <input
              id="eventLocation"
              name="eventLocation"
              type="text"
              placeholder="Building or area"
              value={formData.eventLocation}
              onChange={handleChange}
              className={`${inputClasses} mt-2`}
            />
          </div>

          <div className="w-full">
            <label htmlFor="roomNumber" className="text-sm font-semibold text-gray-900">
              Room or pickup spot
            </label>
            <input
              id="roomNumber"
              name="roomNumber"
              type="text"
              placeholder="2nd floor lounge"
              value={formData.roomNumber}
              onChange={handleChange}
              className={`${inputClasses} mt-2`}
            />
          </div>

          <div className="w-full">
            <label htmlFor="eventDate" className="text-sm font-semibold text-gray-900">
              Date & time
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="text"
              placeholder="March 12, 2:00 PM"
              value={formData.eventDate}
              onChange={handleChange}
              className={`${inputClasses} mt-2`}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="foodType" className="text-sm font-semibold text-gray-900">
                Dietary type
              </label>
              <select
                id="foodType"
                name="foodType"
                value={formData.foodType}
                onChange={handleChange}
                className={`${inputClasses} mt-2`}
              >
                <option value="">Select a type</option>
                <option value="halal">Halal</option>
                <option value="kosher">Kosher</option>
                <option value="vegan">Vegan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="gluten-free">Gluten-free</option>
              </select>
            </div>
            <div>
              <label htmlFor="quantity" className="text-sm font-semibold text-gray-900">
                Estimated servings
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={0}
                step={1}
                placeholder="25"
                value={formData.quantity}
                onChange={handleChange}
                className={`${inputClasses} mt-2`}
              />
            </div>
          </div>

          <div className="w-full">
            <label htmlFor="eventDescription" className="text-sm font-semibold text-gray-900">
              Description & pickup notes
            </label>
            <textarea
              id="eventDescription"
              name="eventDescription"
              placeholder="Share what's on the menu, pickup tips, or allergy info."
              value={formData.eventDescription}
              onChange={handleChange}
              rows={4}
              className={`${inputClasses} mt-2`}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="eventTags" className="text-sm font-semibold text-gray-900">
                Tags
              </label>
              <input
                id="eventTags"
                name="eventTags"
                type="text"
                placeholder="pizza, vegetarian, study break"
                value={formData.eventTags}
                onChange={handleChange}
                className={`${inputClasses} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="eventImage" className="text-sm font-semibold text-gray-900">
                Image URL
              </label>
              <input
                id="eventImage"
                name="eventImage"
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={formData.eventImage}
                onChange={handleChange}
                className={`${inputClasses} mt-2`}
              />
              <p className="mt-2 text-xs text-gray-500">Optional, but photos help events stand out.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <p className="text-sm text-gray-500">Posts go live instantly. Edit or delete from your profile anytime.</p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-500"
            >
              Post event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
