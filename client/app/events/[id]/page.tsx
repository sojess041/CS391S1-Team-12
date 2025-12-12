"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getEventById } from "@/lib/db";
import { EventWithOrganizer } from "@/types/database";
import { FaLocationDot, FaUtensils, FaUser, FaArrowLeft } from "react-icons/fa6";
import { FaEdit } from "react-icons/fa";
import { LuCalendarClock } from "react-icons/lu";
import Modal, { ModalType } from "@/components/modal";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<EventWithOrganizer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
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

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) {
        setError("Invalid event ID");
        setLoading(false);
        return;
      }

      try {
        const eventData = await getEventById(eventId);
        if (!eventData) {
          setError("Event not found");
        } else {
          setEvent(eventData);
          
          // Check if current user is the owner
          const { data: { user } } = await supabase.auth.getUser();
          if (user && eventData.organizer_id === user.id) {
            setIsOwner(true);
          }
        }
      } catch (err: any) {
        console.error("Error fetching event:", err);
        setError(err.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleReserve = async () => {
    if (!event) return;

    setReserving(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Sign In Required",
          message: "Please sign in to reserve an event. Redirecting to login...",
        });
        setTimeout(() => router.push("/login"), 2000);
        return;
      }

      const { data, error: reserveError } = await supabase.rpc("reserve_event", {
        event_id_input: event.id,
        servings: 1,
      });

      if (reserveError) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Reservation Failed",
          message: reserveError.message ?? "Unable to reserve this event. The event may be full or no longer available.",
        });
      } else {
        const updatedQuantity =
          Array.isArray(data) && data.length > 0 ? data[0]?.new_quantity_remaining : undefined;
        
        if (typeof updatedQuantity === "number") {
          setEvent((prev) => prev ? { ...prev, quantity_remaining: updatedQuantity } : null);
        }

        setModal({
          isOpen: true,
          type: "success",
          title: "Reservation Successful!",
          message: `Successfully reserved a serving at ${event.event_name}!`,
        });
      }
    } catch (err: any) {
      console.error("Error reserving event:", err);
      setModal({
        isOpen: true,
        type: "error",
        title: "Reservation Failed",
        message: err.message || "Unable to reserve this event. Please try again.",
      });
    } finally {
      setReserving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
        <p className="text-gray-600 dark:text-slate-400">Loading event...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100 mb-4">Event Not Found</h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6">{error || "The event you're looking for doesn't exist."}</p>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 text-white font-semibold hover:bg-red-700 transition"
          >
            <FaArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const canReserve = event.quantity_remaining > 0 && event.is_active;
  const tags = Array.isArray(event.event_tags) ? event.event_tags : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 mb-6 transition"
        >
          <FaArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>

        <div className="rounded-3xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden transition-colors duration-300">
          {/* Event Image */}
          <div className="relative h-64 w-full bg-gray-100 dark:bg-slate-700 sm:h-96">
            {event.event_image ? (
              <Image
                src={event.event_image}
                alt={event.event_name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 dark:text-slate-500">
                <FaUtensils className="h-16 w-16" />
              </div>
            )}
          </div>

          {/* Event Content */}
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">{event.event_name}</h1>
                  {event.organizer?.full_name && (
                    <p className="text-lg text-gray-600 dark:text-slate-400 flex items-center gap-2">
                      <FaUser className="h-4 w-4" />
                      Hosted by {event.organizer.full_name}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  {event.food_type}
                </span>
              </div>

              {/* Date and Time */}
              <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-2">
                  <LuCalendarClock className="h-5 w-5" />
                  <span className="font-medium">{formatDate(event.event_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-slate-500">•</span>
                  <span>
                    {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <FaLocationDot className="h-5 w-5" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.event_location + (event.room_number ? ` Room ${event.room_number}` : '') + ' Boston University')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:text-red-600 dark:hover:text-red-400 underline transition"
                >
                  {event.event_location}
                </a>
                {event.room_number && (
                  <>
                    <span className="text-gray-400 dark:text-slate-500">•</span>
                    <span>Room {event.room_number}</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {event.event_description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-2">About This Event</h2>
                <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{event.event_description}</p>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-3">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="mb-6 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700 p-4 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-slate-400">Servings Available</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {event.quantity_remaining} of {event.quantity} remaining
                  </p>
                </div>
                {!canReserve && (
                  <span className="inline-flex items-center rounded-full bg-gray-200 dark:bg-slate-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Sold Out
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {isOwner && (
                <Link
                  href={`/events/${eventId}/edit`}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-600 dark:border-red-500 px-6 py-3 text-lg font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  <FaEdit className="h-5 w-5" />
                  Edit Event
                </Link>
              )}
              <button
                onClick={handleReserve}
                disabled={!canReserve || reserving}
                className={`w-full rounded-2xl px-6 py-4 text-lg font-semibold text-white shadow-sm transition ${
                  canReserve && !reserving
                    ? "bg-red-600 hover:bg-red-700 hover:shadow-md"
                    : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                }`}
              >
                {reserving ? "Reserving..." : canReserve ? "Reserve a Plate" : "Event Full"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        autoClose={modal.type === "success" ? 3000 : undefined}
      />
    </div>
  );
}

