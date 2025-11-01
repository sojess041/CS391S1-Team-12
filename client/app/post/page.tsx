"use client";
import { useState, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import { FormData } from "@/types/form";

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
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute top-0 right-[15px] -z-10 hidden md:block" aria-hidden="true">
        <Image src="/terrier_form.png" alt="terriers" width={300} height={300} priority />
      </div>

      <div
        className="pointer-events-none absolute rotate-[10deg] bottom-0 left-[30px] -z-10 hidden md:block"
        aria-hidden="true"
      >
        <Image src="/terrier_4.png" alt="terriers" width={200} height={200} priority />
      </div>

      <div className="flex flex-col w-3/4 mx-auto mt-5 p-5">
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-4xl">Post Leftover Food!</h1>
          <p className="text-xl italic text-gray-600 font-medium my-4">
            Share your event’s leftover food to help reduce food waste and feed students.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-full max-w-4xl mx-auto border border-gray-100 border-2 rounded-xl p-10 shadow-sm"
        >
          <div className="w-full">
            <label htmlFor="eventName" className="block font-semibold text-left text-gray-700 mb-1">
              Event Name
            </label>
            <input
              id="eventName"
              name="eventName"
              type="text"
              placeholder="Event Name"
              value={formData.eventName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="w-full">
            <label htmlFor="eventLocation" className="block text-gray-700 font-semibold mb-1">
              Event Location
            </label>
            <input
              id="eventLocation"
              name="eventLocation"
              type="text"
              placeholder="Building or area"
              value={formData.eventLocation}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="w-full">
            <label htmlFor="roomNumber" className="block text-gray-700 font-semibold mb-1">
              Room Number
            </label>
            <input
              id="roomNumber"
              name="roomNumber"
              type="text"
              placeholder="e.g., 2nd floor lounge"
              value={formData.roomNumber}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="w-full">
            <label htmlFor="eventDate" className="block text-gray-700 font-semibold mb-1">
              Date/Time
            </label>
            <input
              id="eventDate"
              name="eventDate"
              type="text"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="w-full">
            <label htmlFor="foodType" className="block text-gray-700 font-semibold mb-1">
              Food Type
            </label>
            <select
              id="foodType"
              name="foodType"
              value={formData.foodType}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="" disabled></option>
              <option value="halal">Halal</option>
              <option value="kosher">Kosher</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
          <div className="w-full">
            <label htmlFor="quantity" className="block text-gray-700 font-semibold mb-1">
              Quantity
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={0}
              step={1}
              placeholder="Estimated servings"
              value={formData.quantity}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="w-full">
            <label htmlFor="eventDescription" className="block text-gray-700 font-semibold mb-1">
              Event Description
            </label>
            <textarea
              id="eventDescription"
              name="eventDescription"
              placeholder="Add any helpful details (allergens, pickup notes)"
              value={formData.eventDescription}
              onChange={handleChange}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="w-full">
            <label htmlFor="eventTags" className="block text-gray-700 font-semibold mb-1">
              Event Tags
            </label>
            <input
              id="eventTags"
              name="eventTags"
              type="text"
              placeholder="e.g., pizza, halal, vegetarian"
              value={formData.eventTags}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="w-full">
            <label htmlFor="eventImage" className="block text-gray-700 font-semibold mb-1">
              Event Image
            </label>
            <input
              id="eventImage"
              name="eventImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.eventImage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none"
            />
          </div>
          <div className="mx-auto mt-5">
            <button
              type="submit"
              className="w-2xs bg-red-600/70 text-white font-semibold py-2 rounded-md shadow-lg cursor-pointer"
            >
              Post Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
