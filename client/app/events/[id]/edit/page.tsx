"use client";

import Image from "next/image";
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getEventById, updateEvent } from "@/lib/db";
import { Location, FoodCategory } from "@/types/database";
import { FOOD_CATEGORIES, FOOD_CATEGORY_COLORS } from "@/lib/constants";
import Modal, { ModalType } from "@/components/modal";

const inputClasses =
  "w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-base text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-red-400 dark:focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20 transition";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    eventName: "",
    locationId: "",
    roomNumber: "",
    eventDate: "",
    startTime: "",
    endTime: "",
    foodCategories: [] as FoodCategory[],
    quantity: 0,
    eventDescription: "",
    eventTags: "",
  });
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
    const loadEventData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        // Fetch event
        const eventData = await getEventById(eventId);
        if (!eventData) {
          setModal({
            isOpen: true,
            type: "error",
            title: "Event Not Found",
            message: "The event you're trying to edit doesn't exist.",
          });
          setTimeout(() => router.push("/events"), 2000);
          return;
        }

        // Check if user is the owner
        if (eventData.organizer_id !== user.id) {
          setModal({
            isOpen: true,
            type: "error",
            title: "Access Denied",
            message: "You can only edit your own events.",
          });
          setTimeout(() => router.push(`/events/${eventId}`), 2000);
          return;
        }

        setIsOwner(true);

        // Fetch locations
        const { data: locationsData } = await supabase
          .from("locations")
          .select("*")
          .eq("is_active", true)
          .order("name");

        setLocations(locationsData || []);

        // Populate form with event data
        const eventDate = new Date(eventData.event_date);
        const dateStr = eventDate.toISOString().split("T")[0];

        // Get location_id from event or find by name
        let locationId = (eventData as any).location_id || "";
        if (!locationId && eventData.event_location && locationsData) {
          const matchingLocation = locationsData.find(loc => loc.name === eventData.event_location);
          if (matchingLocation) {
            locationId = matchingLocation.id;
          }
        }

        setFormData({
          eventName: eventData.event_name,
          locationId: locationId,
          roomNumber: eventData.room_number || "",
          eventDate: dateStr,
          startTime: eventData.start_time,
          endTime: eventData.end_time,
          foodCategories: (eventData.food_categories || []) as FoodCategory[],
          quantity: eventData.quantity,
          eventDescription: eventData.event_description || "",
          eventTags: Array.isArray(eventData.event_tags) ? eventData.event_tags.join(", ") : "",
        });

        if (eventData.event_image) {
          setExistingImages([eventData.event_image]);
        }
      } catch (error) {
        console.error("Error loading event:", error);
        setModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: "Failed to load event data. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadEventData();
    }
  }, [eventId, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "quantity" ? Number(value) || 0 : value,
    }));
  };

  const toggleFoodCategory = (category: FoodCategory) => {
    setFormData((prev) => ({
      ...prev,
      foodCategories: prev.foodCategories.includes(category)
        ? prev.foodCategories.filter((c) => c !== category)
        : [...prev.foodCategories, category],
    }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remainingSlots = 5 - (existingImages.length + selectedImages.length);
    if (remainingSlots <= 0) {
      alert("Maximum 5 images per event");
      e.target.value = "";
      return;
    }

    const validFiles: File[] = [];
    files.slice(0, remainingSlots).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (5MB max)`);
        return;
      }
      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles]);
    }
    e.target.value = "";
  };

  const handleRemoveImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImages((prev) => prev.filter((_, idx) => idx !== index));
    } else {
      setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Parse date and time
      const eventDateTime = new Date(`${formData.eventDate}T${formData.startTime}`);

      // Get selected location
      const selectedLocation = locations.find((loc) => loc.id === formData.locationId);

      // Parse tags
      const tags = formData.eventTags
        ? formData.eventTags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Update event
      await updateEvent(
        eventId,
        user.id,
        {
          event_name: formData.eventName,
          event_location: selectedLocation?.name || formData.locationId,
          room_number: formData.roomNumber || null,
          event_date: eventDateTime.toISOString(),
          start_time: formData.startTime,
          end_time: formData.endTime,
          food_type: formData.foodCategories[0] || "OTHER",
          food_categories: formData.foodCategories,
          quantity: formData.quantity,
          event_description: formData.eventDescription || null,
          event_tags: tags,
          location_id: formData.locationId || null,
        }
      );

      // Upload new images if any
      if (selectedImages.length > 0) {
        const uploadErrors: string[] = [];
        for (const file of selectedImages) {
          const imageFormData = new FormData();
          imageFormData.append("file", file);

          try {
            const imageResponse = await fetch(`/api/events/${eventId}/images`, {
              method: "POST",
              body: imageFormData,
              credentials: "include",
            });

            if (!imageResponse.ok) {
              let errorMessage = `Failed to upload ${file.name}`;
              try {
                const contentType = imageResponse.headers.get("content-type");
                if (contentType?.includes("application/json")) {
                  const text = await imageResponse.text();
                  if (text && text.trim()) {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.error || errorData.message || errorMessage;
                  }
                }
              } catch {
                // Use default error message
              }
              uploadErrors.push(errorMessage);
            }
          } catch (fileError) {
            uploadErrors.push(`Failed to upload ${file.name}`);
          }
        }

        if (uploadErrors.length > 0) {
          alert(`Some images failed to upload:\n${uploadErrors.join("\n")}`);
        }
      }

      setModal({
        isOpen: true,
        type: "success",
        title: "Event Updated!",
        message: "Your event has been updated successfully!",
      });

      setTimeout(() => {
        router.push(`/events/${eventId}`);
      }, 1500);
    } catch (error: unknown) {
      console.error("Error updating event:", error);
      const message = error instanceof Error ? error.message : "Failed to update event. Please try again.";
      setModal({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
        <p className="text-gray-600 dark:text-slate-400">Loading event...</p>
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="pointer-events-none absolute bottom-0 right-[80px] hidden md:block" aria-hidden="true">
        <Image src="/terrier_4.png" alt="Boston terriers" width={200} height={200} priority />
      </div>
      <div className="mx-auto flex w-11/12 max-w-4xl flex-col pb-12 pt-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-slate-100">Edit Event</h1>
          <p className="mt-3 text-xl italic text-gray-600 dark:text-slate-400">
            Update your event details and information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5 rounded-3xl border border-gray-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 p-8 shadow-sm transition-colors duration-300">
          <div className="w-full">
            <label htmlFor="eventName" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              Event name
            </label>
            <input
              id="eventName"
              name="eventName"
              type="text"
              placeholder="Hackathon showcase lunch"
              value={formData.eventName}
              onChange={handleChange}
              required
              className={`${inputClasses} mt-2`}
            />
          </div>

          <div className="w-full">
            <label htmlFor="locationId" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              Location
            </label>
            <select
              id="locationId"
              name="locationId"
              value={formData.locationId}
              onChange={handleChange}
              required
              className={`${inputClasses} mt-2`}
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <label htmlFor="roomNumber" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
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

          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="eventDate" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                Date
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={handleChange}
                required
                className={`${inputClasses} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="startTime" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                Start Time
              </label>
              <input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
                required
                className={`${inputClasses} mt-2`}
              />
            </div>
            <div>
              <label htmlFor="endTime" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                End Time
              </label>
              <input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
                required
                className={`${inputClasses} mt-2`}
              />
            </div>
          </div>

          <div className="w-full">
            <label className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 block">Food Categories</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {FOOD_CATEGORIES.map((category) => (
                <label
                  key={category.value}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors duration-200"
                  style={{
                    borderColor: formData.foodCategories.includes(category.value as FoodCategory)
                      ? FOOD_CATEGORY_COLORS[category.value as FoodCategory]
                      : undefined,
                    backgroundColor: formData.foodCategories.includes(category.value as FoodCategory)
                      ? `${FOOD_CATEGORY_COLORS[category.value as FoodCategory]}20`
                      : undefined,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.foodCategories.includes(category.value as FoodCategory)}
                    onChange={() => toggleFoodCategory(category.value as FoodCategory)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-red-600 focus:ring-red-500 dark:focus:ring-red-400 bg-white dark:bg-slate-900"
                  />
                  <span className="text-sm text-gray-700 dark:text-slate-300">{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="w-full">
            <label htmlFor="quantity" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              Estimated servings
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              step={1}
              placeholder="25"
              value={formData.quantity}
              onChange={handleChange}
              required
              className={`${inputClasses} mt-2`}
            />
          </div>

          <div className="w-full">
            <label htmlFor="eventDescription" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
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

          <div className="w-full">
            <label htmlFor="eventTags" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              Tags (comma-separated)
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

          <div className="w-full">
            <label htmlFor="eventImages" className="text-sm font-semibold text-gray-900 dark:text-slate-100">
              Images (up to 5 total, max 5MB each)
            </label>
            
            {existingImages.length > 0 && (
              <div className="mt-3 space-y-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-3">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Existing Images:</p>
                {existingImages.map((imageUrl, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-slate-300"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">Image {index + 1}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, true)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 dark:hover:text-red-500 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              id="eventImages"
              name="eventImages"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageUpload}
              disabled={submitting}
              className={`${inputClasses} mt-2`}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
              Optional. JPEG, PNG, WebP, or GIF. You can add{" "}
              {Math.max(0, 5 - (existingImages.length + selectedImages.length))} more.
            </p>
            {selectedImages.length > 0 && (
              <div className="mt-3 space-y-2 rounded-xl border border-dashed border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-3 transition-colors duration-300">
                {selectedImages.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between gap-3 text-sm text-gray-700 dark:text-slate-300"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{file.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index, false)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 dark:hover:text-red-500 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Update Event"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/events/${eventId}`)}
              className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-300 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        autoClose={modal.type === "success" ? 2000 : undefined}
      />
    </div>
  );
}

