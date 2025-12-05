"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EventCardProps } from "@/types/event";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

type ReserveEventResult = {
  reservation_id: string;
  new_quantity_remaining: number;
};

export default function EventsPage() {
  const [events, setEvents] = useState<EventCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframeFilter, setTimeframeFilter] = useState<"all" | "week">("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [reservingId, setReservingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    logger.debug("Events page mounted");
    
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
      const startTime = Date.now();
      setLoading(true);
      setError(null);

      logger.debug("Fetching events from database");

      try {
        const { data, error: fetchError } = await supabase
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
          .gt("quantity_remaining", 0)
          .order("event_date", { ascending: true });

        if (fetchError) {
          logger.error("Failed to fetch events", fetchError);
          setError("Unable to load events right now. Please try again later.");
          setEvents([]);
        } else {
          const rows = ((data ?? []) as unknown) as EventsQueryRow[];
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
          
          const duration = Date.now() - startTime;
          logger.info("Events loaded successfully", { 
            count: mappedEvents.length,
            duration
          });
          
          setEvents(mappedEvents);
        }
      } catch (err) {
        logger.error("Unexpected error fetching events", err as Error);
        setError("An unexpected error occurred. Please try again.");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    if (timeframeFilter !== "week") return events;
    const now = new Date();
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);

    return events.filter((event) => {
      const eventDate = new Date(event.eventDate);
      if (Number.isNaN(eventDate.getTime())) return true;
      return eventDate >= now && eventDate <= weekAhead;
    });
  }, [events, timeframeFilter]);

  const totalServingsLeft = useMemo(
    () => events.reduce((sum, event) => sum + (event.quantityRemaining ?? 0), 0),
    [events]
  );

  const highlightStats = [{ label: "Total events", value: events.length }];

  const formatEventDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(parsed);
  };

  const formatEventTimeRange = (start: string, end: string) => {
    const startDate = new Date(`1970-01-01T${start}`);
    const endDate = new Date(`1970-01-01T${end}`);
    const formatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });
    const startLabel = Number.isNaN(startDate.getTime()) ? start : formatter.format(startDate);
    const endLabel = Number.isNaN(endDate.getTime()) ? end : formatter.format(endDate);
    return `${startLabel} – ${endLabel}`;
  };

  const handleReserve = useCallback(
    async (event: EventCardProps) => {
      if (!event.id) {
        logger.warn("Attempted to reserve event without ID");
        return;
      }
      
      setFeedback(null);
      setReservingId(event.id);
      
      logger.debug("Attempting to reserve event", { 
        eventId: event.id, 
        eventName: event.eventName 
      });

      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          logger.warn("User not authenticated on reserve attempt");
          router.push("/login");
          setFeedback({ type: "error", message: "Please sign in to reserve an event." });
          return;
        }

        logger.debug("Calling reserve_event RPC", { 
          userId: userData.user.id,
          eventId: event.id 
        });

        const { data, error: reserveError } = await supabase.rpc("reserve_event", {
                    event_id_input: event.id,
          servings: 1,
        });

        if (reserveError) {
          logger.error("Reservation failed", reserveError, { 
            userId: userData.user.id,
            eventId: event.id,
            eventName: event.eventName
          });
          setFeedback({ type: "error", message: reserveError.message ?? "Unable to reserve this event." });
        } else {
          const updatedQuantity =
            Array.isArray(data) && data.length > 0 ? data[0]?.new_quantity_remaining : undefined;
          
          if (typeof updatedQuantity === "number") {
            setEvents((prev) =>
              prev.map((item) =>
                item.id === event.id ? { ...item, quantityRemaining: updatedQuantity } : item
              )
            );
          }
          
          logger.info("Event reserved successfully", { 
            userId: userData.user.id,
            eventId: event.id,
            eventName: event.eventName,
            newQuantity: updatedQuantity
          });
          
          setFeedback({ type: "success", message: `Reserved a serving at ${event.eventName}.` });
        }
      } catch (err) {
        logger.error("Unexpected error during reservation", err as Error, {
          eventId: event.id,
          eventName: event.eventName
        });
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Unable to reserve this event.",
        });
      } finally {
        setReservingId(null);
      }
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl text-center md:text-left">
              <p className="text-xs uppercase tracking-[0.4em] text-gray-500">Campus roundup</p>
              <h1 className="mt-2 text-4xl font-semibold text-gray-900">Events with servings left</h1>
              <p className="mt-2 text-base text-gray-600">
                Browse every active event that still has food to share. Filters keep the view focused without changing the theme.
              </p>
            </div>
            <div className="flex w-full justify-center md:w-auto md:justify-end">
              <div className="grid gap-4 sm:grid-cols-1">
                {highlightStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                    <p className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-semibold text-gray-900">Current listings</h2>
            <p className="text-sm text-gray-500">Every active event with servings remaining, sorted by date.</p>
          </div>

          {feedback && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="mt-8 min-h-[240px]">
            {loading && <p className="text-center text-gray-600">Loading events...</p>}
            {!loading && error && <p className="text-center text-red-600">{error}</p>}
            {!loading && !error && filteredEvents.length === 0 && (
              <p className="text-center text-gray-600">
                No events currently match this view. Try switching filters or check back later!
              </p>
            )}
            {!loading && !error && filteredEvents.length > 0 && (
              <div className="space-y-5">
                {filteredEvents.map((event) => {
                  const description =
                    event.eventDescription && event.eventDescription.length > 220
                      ? `${event.eventDescription.slice(0, 217)}...`
                      : event.eventDescription;
                  const tags = Array.isArray(event.eventTags) ? event.eventTags.slice(0, 4) : [];
                  const disabled = (event.quantityRemaining ?? 0) <= 0 || reservingId === event.id;

                  return (
                    <article
                      key={event.id ?? event.eventName}
                      className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white/70 p-5 shadow-sm transition hover:border-gray-300 hover:bg-white"
                    >
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-gray-100 md:h-48 md:w-64">
                          {event.eventImage ? (
                            <Image
                              src={event.eventImage}
                              alt={event.eventName}
                              fill
                              sizes="(min-width:1024px) 256px, (min-width:640px) 50vw, 100vw"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-500">
                              Image coming soon
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-4">
                          <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                                {formatEventDate(event.eventDate)}
                              </p>
                              <h3 className="mt-1 text-2xl font-semibold text-gray-900">{event.eventName}</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {event.eventLocation}
                                {event.roomNumber ? ` · Room ${event.roomNumber}` : ""}
                              </p>
                              {event.organizerName && (
                                <p className="text-sm text-gray-500">Hosted by {event.organizerName}</p>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 lg:text-right">
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                                {event.foodType}
                              </span>
                              <p className="mt-2 text-base font-semibold text-gray-900">
                                {formatEventTimeRange(event.startTime, event.endTime)}
                              </p>
                              <p className="text-sm">
                                <span className="font-semibold text-gray-900">{event.quantityRemaining}</span> of{" "}
                                {event.quantity} servings left
                              </p>
                            </div>
                          </div>
                          {description && <p className="text-sm text-gray-600">{description}</p>}
                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex flex-wrap gap-2">
                              {tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleReserve(event)}
                              disabled={disabled}
                              className={`ml-auto inline-flex items-center rounded-2xl px-5 py-2 text-sm font-semibold transition ${
                                disabled
                                  ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-500"
                                  : "border border-red-200 text-red-600 hover:bg-red-50"
                              }`}
                            >
                              {reservingId === event.id ? "Reserving..." : "Reserve a plate"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}