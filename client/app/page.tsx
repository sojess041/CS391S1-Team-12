"use client";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";
import EventCard from "@/components/event-card";
import { EventCardProps } from "@/types/event";
import Image from "next/image";

export default function Home() {
  const [eventInput, SetEventInput] = useState("");
  const [eventData, setEventData] = useState<EventCardProps[] | null>(null);

  const mockData: EventCardProps[] = [
    {
      eventName: "Leftover Pizza",
      organizerName: "CS Society",
      location: "Engineering Lounge",
      foodType: "Pizza",
      timeframe: "2:00 PM to 3:00 PM",
      quantity: 12,
    },
    {
      eventName: "Bagels & Coffee",
      organizerName: "Library",
      location: "Main Lobby",
      foodType: "Bagels, Coffee",
      timeframe: "9:00 AM to 10:30 AM",
      quantity: 24,
    },
    {
      eventName: "Sandwiches",
      organizerName: "Student Center",
      location: "Food Court",
      foodType: "Assorted Sandwiches",
      timeframe: "12:15 PM to 1:30 PM",
      quantity: 18,
    },
    {
      eventName: "Vegan Bowls",
      organizerName: "Sustainability Club",
      location: "Quad",
      foodType: "Vegan Grain Bowls",
      timeframe: "1:00 PM to 2:00 PM",
      quantity: 10,
    },
    {
      eventName: "Donut Drop",
      organizerName: "Math Club",
      location: "Hall B",
      foodType: "Assorted Donuts",
      timeframe: "8:00 AM to 9:00 AM",
      quantity: 36,
    },
    {
      eventName: "Taco Night",
      organizerName: "Cultural Society",
      location: "Community Center",
      foodType: "Tacos",
      timeframe: "6:00 PM to 7:30 PM",
      quantity: 40,
    },
    {
      eventName: "Dubai Chocolate",
      organizerName: "Math Club",
      location: "Hall B",
      foodType: "Assorted Donuts",
      timeframe: "8:00 AM to 9:00 AM",
      quantity: 36,
    },
    {
      eventName: "Hey Tea",
      organizerName: "Cultural Society",
      location: "Community Center",
      foodType: "Tacos",
      timeframe: "6:00 PM to 7:30 PM",
      quantity: 40,
    },
  ];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    SetEventInput(event.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col justify-content items-center">
      <main className="flex flex-col items-center justify-center p-24">
        <h1 className="font-semibold text-6xl leading-none tracking-normal text-center">
          Find <span className="uppercase text-red-600 italic font-thin">Free</span> Food Around Campus!
        </h1>
        <p className="font-normal italic text-6xl leading-none tracking-normal text-center mt-4">
          A site made by students, for students.
        </p>
        <label className="relative mt-9 block w-full max-w-3xl ">
          <span className="sr-only">Search</span>
          <input
            type="text"
            value={eventInput}
            onChange={handleChange}
            id="eventInput"
            placeholder="Search..."
            className="w-full rounded-full border border-gray-300 bg-gray-100/50 pl-8 py-4 shadow-sm focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
            <FaSearch className="h-4 w-4 mr-2" aria-hidden="true" />
          </span>
        </label>
        <Image src="/icon.png" alt="Boston terriers" width={800} height={700} style={{ clipPath: "inset(1px)" }} />
      </main>
      <section className="mt-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mockData.map((e) => (
            <EventCard
              key={e.eventName}
              eventName={e.eventName}
              organizerName={e.organizerName}
              location={e.location}
              foodType={e.foodType}
              timeframe={e.timeframe}
              quantity={e.quantity}
              image={e.image}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
