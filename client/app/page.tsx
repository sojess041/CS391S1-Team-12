"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";
import { EventCardProps } from "@/types/event";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import EventMarquee from "@/components/event-marquee";

export default function Home() {
  const [eventInput, SetEventInput] = useState("");
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    type EventsQueryRow = {
      id: string;
      event_name: string;
      event_location: string;
      room_number: string | null;
      event_date: string;
      start_time: string;
      end_time: string;
      food_type: string;
      quantity: number;
      quantity_remaining: number;
      event_description: string | null;
      event_tags: string[] | null;
      event_image: string | null;
      organizer: {
        full_name: string | null;
      } | null;
    };

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError(null);
      try {
        const { data, error } = await supabase
          .from("events")
          .select(
            `
            id,
            event_name,
            event_location,
            room_number,
            event_date,
            start_time,
            end_time,
            food_type,
            quantity,
            quantity_remaining,
            event_description,
            event_tags,
            event_image,
            organizer:users!events_organizer_id_fkey (
              full_name
            )
          `
          )
          .eq("is_active", true)
          .order("event_date", { ascending: true })
          .limit(10);

        if (error) {
          throw error;
        }

        const rows = (data ?? []) as unknown as EventsQueryRow[];

        const mappedEvents: EventCardProps[] = rows.map((event) => ({
          id: event.id,
          eventName: event.event_name,
          eventLocation: event.event_location,
          roomNumber: event.room_number ?? undefined,
          eventDate: event.event_date,
          startTime: event.start_time,
          endTime: event.end_time,
          foodType: event.food_type,
          quantity: event.quantity,
          quantityRemaining: event.quantity_remaining,
          eventDescription: event.event_description ?? undefined,
          eventTags: event.event_tags ?? undefined,
          eventImage: event.event_image ?? undefined,
          organizerName: event.organizer?.full_name ?? undefined,
        }));

        setEvents(mappedEvents);
      } catch (err) {
        console.error("Unable to fetch events:", err);
        setEventsError("Unable to load upcoming events. Please try again later.");
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    SetEventInput(event.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        <motion.main
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center justify-center px-6 pb-16 pt-24 text-center sm:px-10 lg:px-24"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="font-semibold text-6xl leading-tight tracking-tight text-gray-900"
          >
            Find{" "}
            <motion.span
              className="inline-block uppercase text-red-600 italic font-thin"
              animate={{ scale: [1, 1.05, 1], rotate: [0, 1.5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              Free
            </motion.span>{" "}
            Food Around Campus!
          </motion.h1>
          <motion.p
            className="mt-4 text-3xl font-normal italic text-gray-600"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            A site made by students, for students.
          </motion.p>
          <motion.label
            className="relative mt-9 block w-full max-w-3xl"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          >
            <span className="sr-only">Search</span>
            <input
              type="text"
              value={eventInput}
              onChange={handleChange}
              id="eventInput"
              placeholder="Search..."
              className="w-full rounded-full border border-gray-200 bg-white/80 pl-8 pr-16 py-4 text-lg text-gray-900 shadow-lg focus:outline-none"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500">
              <FaSearch className="h-5 w-5" aria-hidden="true" />
            </span>
          </motion.label>
          <motion.div
            className="mt-12"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
          >
            <Image src="/icon.png" alt="Boston terriers" width={800} height={700} style={{ clipPath: "inset(1px)" }} />
          </motion.div>
        </motion.main>
      </div>
      <section className="mt-10 w-full px-6">
        {loadingEvents && <p className="text-center text-gray-600">Loading events...</p>}
        {!loadingEvents && eventsError && <p className="text-center text-red-600">{eventsError}</p>}
        {!loadingEvents && !eventsError && events.length === 0 && (
          <p className="text-center text-gray-600">No active events available right now.</p>
        )}
        {!loadingEvents && !eventsError && events.length > 0 && <EventMarquee events={events} />}
      </section>
    </div>
  );
}
