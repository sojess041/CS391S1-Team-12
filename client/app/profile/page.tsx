"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { FaUtensils, FaClipboardList, FaUser } from "react-icons/fa6";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import Modal, { ModalType } from "@/components/modal";

interface Reservation {
  id: string;
  event_id: string;
  quantity_reserved: number;
  status: string;
  reserved_at: string;
}

interface Event {
  id: string;
  event_name: string;
  event_location: string;
  room_number: string;
  event_date: string;
  food_type?: string;
  quantity: number;
  event_image?: string;
}

interface ReservationWithEvent extends Reservation {
  event: Event | null;
}

interface UserProfile {
  full_name: string;
  email: string;
  food_restrictions: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reservations, setReservations] = useState<ReservationWithEvent[]>([]);
  const [pendingCancellation, setPendingCancellation] = useState<{ id: string; eventName: string } | null>(null);
  const [processingCancellation, setProcessingCancellation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
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
  const router = useRouter();

  const dietaryOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-free",
    "Halal",
    "Kosher",
    "Nut-free",
    "Dairy-free",
  ];

  useEffect(() => {
    logger.debug("Profile page mounted");
    loadProfileData();
  }, []);

  async function loadProfileData() {
    const startTime = Date.now();
    try {
      const supabase = createSupabaseClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        logger.warn("User not authenticated on profile page", { error: userError?.message });
        setLoading(false);
        return;
      }

      logger.debug("Loading profile data", { userId: user.id });

      const { data: profileData, error: profileError } = await supabase
        .from("users")
        .select("full_name, email, food_restrictions")
        .eq("id", user.id)
        .single();

      if (profileError) {
        logger.error("Failed to load user profile", profileError, { userId: user.id });
      } else {
        setProfile(profileData);
        setSelectedPreferences(profileData.food_restrictions || []);
        logger.info("Profile loaded", { 
          userId: user.id,
          hasPreferences: profileData.food_restrictions?.length > 0 
        });
      }

      const { data: reservationsData, error: reservationsError } = await supabase
        .from("reservations")
        .select("*")
        .eq("user_id", user.id)
        .order("reserved_at", { ascending: false })
        .limit(50);

      if (reservationsError) {
        logger.error("Failed to load reservations", reservationsError, { userId: user.id });
        setReservations([]);
      } else if (reservationsData && reservationsData.length > 0) {
        const eventIds = reservationsData.map((r: Reservation) => r.event_id);
        const { data: eventsData, error: eventsError } = await supabase
          .from("events")
          .select("*")
          .in("id", eventIds);

        if (eventsError) {
          logger.error("Failed to load event details", eventsError, { userId: user.id });
          setReservations(reservationsData.map((r: Reservation) => ({ ...r, event: null })));
        } else {
          const eventsMap = new Map(eventsData?.map((e: Event) => [e.id, e]) || []);
          const reservationsWithEvents = reservationsData.map((r: Reservation) => ({
            ...r,
            event: eventsMap.get(r.event_id) || null
          }));
          setReservations(reservationsWithEvents);
          
          const duration = Date.now() - startTime;
          logger.info("Profile data loaded successfully", { 
            userId: user.id,
            reservationsCount: reservationsData.length,
            duration
          });
        }
      } else {
        setReservations([]);
        logger.info("No reservations found", { userId: user.id });
      }

    } catch (error) {
      logger.error("Unexpected error loading profile", error as Error);
    } finally {
      setLoading(false);
    }
  }

  async function updatePreferences() {
    const startTime = Date.now();
    logger.debug("Updating food preferences", { 
      oldCount: profile?.food_restrictions?.length || 0,
      newCount: selectedPreferences.length,
      preferences: selectedPreferences
    });

    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        logger.warn("Cannot update preferences - user not authenticated");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({ food_restrictions: selectedPreferences })
        .eq("id", user.id);

      if (error) {
        logger.error("Failed to update preferences", error, { 
          userId: user.id,
          preferences: selectedPreferences
        });
        setModal({
          isOpen: true,
          type: "error",
          title: "Update Failed",
          message: "Failed to update preferences. Please try again.",
        });
        alert("Failed to update preferences. Please try again.");
      } else {
        setProfile(prev => prev ? { ...prev, food_restrictions: selectedPreferences } : null);
        setEditingPreferences(false);
        const duration = Date.now() - startTime;
        logger.info("Preferences updated successfully", { 
          userId: user.id,
          preferences: selectedPreferences,
          duration
        });
        setModal({
          isOpen: true,
          type: "success",
          title: "Preferences Updated",
          message: "Your dietary preferences have been updated successfully!",
        });
      }
    } catch (error) {
      logger.error("Unexpected error updating preferences", error as Error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "An error occurred. Please try again.",
      });
      }
    } catch (error) {
      logger.error("Unexpected error updating preferences", error as Error);
      alert("An error occurred. Please try again.");
    }
  }

  function togglePreference(pref: string) {
    setSelectedPreferences(prev =>
      prev.includes(pref)
        ? prev.filter(p => p !== pref)
        : [...prev, pref]
    );
    logger.debug("Preference toggled", { preference: pref });
  }

  async function cancelReservation(reservationId: string, eventName: string) {
    logger.debug("Canceling reservation", { reservationId, eventName });
    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        logger.warn("Cannot cancel reservation - user not authenticated");
        return;
      }

      const { error } = await supabase
        .from("reservations")
        .delete()
        .eq("id", reservationId)
        .eq("user_id", user.id);

      if (error) {
        logger.error("Failed to cancel reservation", error, { 
          userId: user.id,
          reservationId,
          eventName
        });
        setModal({
          isOpen: true,
          type: "error",
          title: "Cancellation Failed",
          message: "Failed to cancel reservation. Please try again.",
        });
        alert("Failed to cancel reservation. Please try again.");
      } else {
        setReservations(prev => prev.filter(r => r.id !== reservationId));
        logger.info("Reservation cancelled", { 
          userId: user.id,
          reservationId,
          eventName
        });
        setModal({
          isOpen: true,
          type: "success",
          title: "Reservation Cancelled",
          message: `Your reservation for ${eventName} has been cancelled.`,
        });
      }
    } catch (error) {
      logger.error("Unexpected error canceling reservation", error as Error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "An error occurred. Please try again.",
      });
      }
    } catch (error) {
      logger.error("Unexpected error canceling reservation", error as Error);
      alert("An error occurred. Please try again.");
    }
  }

  const handleDismissCancellation = () => {
    if (processingCancellation) return;
    setPendingCancellation(null);
  };

  const handleConfirmCancellation = async () => {
    if (!pendingCancellation) return;
    setProcessingCancellation(true);
    await cancelReservation(pendingCancellation.id, pendingCancellation.eventName);
    setProcessingCancellation(false);
    setPendingCancellation(null);
  };

  async function handleLogout() {
    logger.debug("User attempting to logout");
    
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error("Logout failed", error);
        setModal({
          isOpen: true,
          type: "error",
          title: "Logout Failed",
          message: "Failed to log out. Please try again.",
        });
        alert("Failed to log out. Please try again.");
      } else {
        logger.info("User logged out successfully");
        router.push("/login");
      }
    } catch (err) {
      logger.error("Unexpected error during logout", err as Error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "An error occurred. Please try again.",
      });
      alert("An error occurred. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen bg-gray-50">
        <div className="pointer-events-none absolute bottom-0 right-[80px] hidden md:block" aria-hidden="true">
          <Image src="/terrier_4.png" alt="Boston terriers" width={200} height={200} priority />
        </div>

        <div className="mx-auto w-11/12 max-w-5xl py-10">
        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <FaUser className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">{profile.full_name}</h1>
                <p className="mt-1 text-gray-600">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300 transition"
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <FaUtensils className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Food Preferences</h2>
                <p className="text-sm text-gray-600">Let us know your dietary restrictions so events can match your needs.</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (editingPreferences) {
                  updatePreferences();
                } else {
                  setEditingPreferences(true);
                  logger.debug("Entered preference editing mode");
                }
              }}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition"
            >
              {editingPreferences ? "Save" : "Edit"}
            </button>
          </div>

          {editingPreferences ? (
            <div className="space-y-2">
              {dietaryOptions.map(option => (
                <label
                  key={option}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedPreferences.includes(option)}
                    onChange={() => togglePreference(option)}
                    className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
              <button
                onClick={() => {
                  setSelectedPreferences(profile.food_restrictions || []);
                  setEditingPreferences(false);
                  logger.debug("Preference editing cancelled");
                }}
                className="mt-3 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.food_restrictions && profile.food_restrictions.length > 0 ? (
                profile.food_restrictions.map(pref => (
                  <span
                    key={pref}
                    className="inline-flex items-center rounded-full bg-red-100 px-4 py-2 text-sm font-medium text-red-800"
                  >
                    {pref}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No preferences set. Click "Edit" to add some!</p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <FaClipboardList className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">My Reservations</h2>
              <p className="text-sm text-gray-600">Keep track of your upcoming food pickups.</p>
            </div>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't reserved any events yet.</p>
              <a
                href="/events"
                className="mt-4 inline-block text-red-600 hover:text-red-500 font-medium"
              >
                Explore events →
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map(reservation => (
                <div
                  key={reservation.id}
                  className="flex flex-col md:flex-row gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:shadow-md transition"
                >
                  {reservation.event?.event_image && (
                    <div className="relative h-32 w-full md:w-32 flex-shrink-0 overflow-hidden rounded-xl">
                      <Image
                        src={reservation.event.event_image}
                        alt={reservation.event.event_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {reservation.event?.event_name || "Event details unavailable"}
                    </h3>
                    {reservation.event && (
                      <>
                        <p className="mt-1 text-sm text-gray-600">
                          {reservation.event.event_location} - {reservation.event.room_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reservation.event.event_date}
                        </p>
                        <p className="text-sm text-gray-600">
                          Reserved: {reservation.quantity_reserved} servings
                        </p>
                        {reservation.event.food_type && (
                          <span className="mt-2 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                            {reservation.event.food_type}
                          </span>
                        )}
                      </>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      Reserved on {new Date(reservation.reserved_at).toLocaleDateString()}
                    </p>
                    <span className={`mt-1 inline-block text-xs font-medium ${
                      reservation.status === 'confirmed' ? 'text-green-600' :
                      reservation.status === 'cancelled' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      Status: {reservation.status}
                    </span>
                  </div>

                  {reservation.status !== "cancelled" && (
                    <button
                      onClick={() =>
                        setPendingCancellation({
                          id: reservation.id,
                          eventName: reservation.event?.event_name || "this event",
                        })
                      }
                      className="self-start rounded-xl bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
      {pendingCancellation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <FiAlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cancel reservation?</h3>
                <p className="text-sm text-gray-600">
                  You&apos;re about to cancel your spot for{" "}
                  <span className="font-semibold text-gray-900">"{pendingCancellation.eventName}"</span>. This opens the
                  plate for another student. You can reserve again if servings remain.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismissCancellation}
                className="ml-auto rounded-full bg-gray-100 p-2 text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleDismissCancellation}
                disabled={processingCancellation}
                className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-70"
              >
                Keep reservation
              </button>
              <button
                type="button"
                onClick={handleConfirmCancellation}
                disabled={processingCancellation}
                className="rounded-2xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {processingCancellation ? "Canceling..." : "Cancel reservation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />
    </>
  );
}
