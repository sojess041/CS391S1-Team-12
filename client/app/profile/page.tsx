"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FiBell, FiCalendar, FiLogOut } from "react-icons/fi";

type ReservationEventDetails = {
  id: string;
  name: string;
  location: string;
  date: string;
  startTime: string;
};

type ReservationActivity = {
  id: string;
  quantityReserved: number;
  status: string;
  reservedAt: string;
  event: ReservationEventDetails;
};

type ProfileDetails = {
  fullName: string;
  major: string;
  graduationYear: string;
  preferredCampus: string;
};

type UserMetadata = {
  full_name?: string;
  major?: string;
  graduation_year?: string;
  preferred_campus?: string;
  role?: string;
};

type ReservationRow = {
  id: string;
  event_id: string;
  quantity_reserved: number;
  status: string;
  reserved_at: string;
  event: {
    id: string;
    event_name: string;
    event_location: string;
    event_date: string;
    start_time: string;
  } | null;
};

const formatEventDateLabel = (dateString?: string, timeString?: string) => {
  if (!dateString) return "Date TBA";
  const date = new Date(`${dateString}T${timeString ?? "00:00:00"}`);
  const datePart = Number.isNaN(date.getTime())
    ? dateString
    : new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
  if (!timeString) return datePart;
  const time = new Date(`1970-01-01T${timeString}`);
  const timePart = Number.isNaN(time.getTime())
    ? timeString
    : new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(time);
  return `${datePart} · ${timePart}`;
};

const formatReservedAtLabel = (timestamp?: string) => {
  if (!timestamp) return "";
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return timestamp;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const statusBadgeClasses = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (normalized === "cancelled") return "bg-gray-100 text-gray-600";
  return "bg-amber-50 text-amber-700";
};

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null);
  const [reservations, setReservations] = useState<ReservationActivity[]>([]);
  const [reservationsError, setReservationsError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: userData, error } = await supabase.auth.getUser();
      if (error || !userData.user) {
        router.replace("/login");
        return;
      }

      const metadata = (userData.user.user_metadata ?? {}) as UserMetadata;
      setEmail(userData.user.email ?? null);
      setRole(metadata.role ?? userData.user.app_metadata?.role ?? null);
      setReservationsError(null);

      setProfileDetails({
        fullName: metadata.full_name ?? userData.user.email?.split("@")[0] ?? "Community Member",
        major: metadata.major ?? "Undeclared major",
        graduationYear: metadata.graduation_year ?? "TBD",
        preferredCampus: metadata.preferred_campus ?? "Main campus",
      });

      const userId = userData.user.id;
      const { data: reservationRows, error: reservationsFetchError } = await supabase
        .from("reservations")
        .select(
          `
          id,
          event_id,
          quantity_reserved,
          status,
          reserved_at,
          event:events (
            id,
            event_name,
            event_location,
            event_date,
            start_time
          )
        `
        )
        .eq("user_id", userId)
        .order("reserved_at", { ascending: false })
        .limit(5);

      if (reservationsFetchError) {
        console.error("Unable to load reservations:", reservationsFetchError);
        setReservationsError("Unable to load your reservations right now.");
        setReservations([]);
      } else {
        const rows = (reservationRows ?? []) as ReservationRow[];
        const mappedReservations = rows.map((reservation) => {
          const event = reservation.event;
          return {
            id: reservation.id,
            quantityReserved: reservation.quantity_reserved,
            status: reservation.status,
            reservedAt: reservation.reserved_at,
            event: {
              id: event?.id ?? reservation.event_id,
              name: event?.event_name ?? "Campus event",
              location: event?.event_location ?? "Location TBA",
              date: event?.event_date ?? "Date TBA",
              startTime: event?.start_time ?? "",
            },
          } satisfies ReservationActivity;
        });
        setReservations(mappedReservations);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router]);

  const initials = useMemo(() => {
    if (!profileDetails && !email) return "U";
    const source = profileDetails?.fullName ?? email ?? "User";
    const pieces = source
      .split(" ")
      .filter((part) => part.length > 0)
      .slice(0, 2);
    if (pieces.length === 0) return source.slice(0, 2).toUpperCase();
    return pieces
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }, [profileDetails, email]);

  if (loading || !profileDetails) {
    return null;
  }

  const quickActions = [
    {
      title: "Plan an event",
      description: "Share leftover catering or host a community drop.",
      action: () => router.push("/post"),
      icon: <FiCalendar className="h-5 w-5 text-red-500" />,
    },
    {
      title: "Notification settings",
      description: "Choose which food alerts hit your inbox.",
      action: () => router.push("/profile?tab=alerts"),
      icon: <FiBell className="h-5 w-5 text-red-500" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-3xl bg-gray-100 text-3xl font-semibold uppercase text-gray-900">
              {initials}
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] text-gray-500">{role ?? "Community Member"}</p>
                <h1 className="text-3xl font-semibold text-gray-900">{profileDetails.fullName}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span>{email}</span>
                <span className="flex items-center gap-2">
                  <FiCalendar className="h-4 w-4 text-red-600" />
                  {profileDetails.graduationYear}
                </span>
                <span>{profileDetails.major}</span>
              </div>
            </div>
            <div className="flex flex-1 items-center justify-end md:flex-col md:items-end md:justify-center">
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
              >
                <FiLogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quick actions</h2>
            <p className="text-sm text-gray-500">Keep track of food drops.</p>
          </div>
          <div className="mt-4 space-y-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                onClick={action.action}
                className="flex w-full items-start gap-4 rounded-2xl border border-gray-200 p-4 text-left transition hover:border-red-300 hover:bg-red-50/70"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">{action.icon}</span>
                <span>
                  <p className="text-base font-semibold text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your reservations</h2>
              <p className="text-sm text-gray-500">Based on your most recent holds.</p>
            </div>
            {reservations.length > 0 && (
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Updated {formatReservedAtLabel(reservations[0].reservedAt)}
              </p>
            )}
          </div>
          <div className="mt-4 space-y-4">
            {reservationsError && <p className="text-sm text-red-600">{reservationsError}</p>}
            {!reservationsError && reservations.length === 0 && (
              <p className="text-sm text-gray-600">
                You haven&apos;t reserved any events yet. RSVP to an event and your activity will appear here.
              </p>
            )}
            {!reservationsError &&
              reservations.map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">{reservation.event.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatEventDateLabel(reservation.event.date, reservation.event.startTime)} · {reservation.event.location}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                      Reserved {formatReservedAtLabel(reservation.reservedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadgeClasses(
                        reservation.status
                      )}`}
                    >
                      {reservation.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">Qty {reservation.quantityReserved}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
