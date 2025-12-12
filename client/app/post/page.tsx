"use client";
import Image from "next/image";
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Location, FoodCategory } from "@/types/database";
import { FOOD_CATEGORIES, FOOD_CATEGORY_COLORS } from "@/lib/constants";
import confetti from "canvas-confetti";

const inputClasses =
  "w-full rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-base text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-red-400 dark:focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20 transition";

export default function Post() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
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

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // Check if user is organizer
      const { data: userData } = await supabase
        .from("users")
        .select("is_organizer, role")
        .eq("id", user.id)
        .single();

      const canPost = userData?.is_organizer || userData?.role === "organizer";
      setIsOrganizer(canPost);

      if (!canPost) {
        alert("Only organizers can post events. Please enable organizer mode in settings.");
        router.replace("/settings");
        return;
      }

      // Fetch locations
      const { data: locationsData } = await supabase
        .from("locations")
        .select("*")
        .eq("is_active", true)
        .order("name");

      setLocations(locationsData || []);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

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

    const remainingSlots = 5 - selectedImages.length;
    if (remainingSlots <= 0) {
      alert("Maximum 5 images per event");
      e.target.value = "";
      return;
    }

    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];

    files.slice(0, remainingSlots).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        oversizedFiles.push(file.name);
        return;
      }
      validFiles.push(file);
    });

    if (files.length > remainingSlots) {
      alert(`You can upload up to 5 images total. Skipped ${files.length - remainingSlots} file(s).`);
    }

    if (oversizedFiles.length > 0) {
      alert(`These files are too large (5MB max): ${oversizedFiles.join(", ")}`);
    }

    if (validFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...validFiles]);
    }
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
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

      // Combine food categories and tags
      const allTags = [
        ...formData.foodCategories,
        ...(formData.eventTags
          ? formData.eventTags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : []),
      ];

      // Create event
      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          organizer_id: user.id,
          event_name: formData.eventName,
          event_location: selectedLocation?.name || formData.locationId,
          room_number: formData.roomNumber || null,
          event_date: eventDateTime.toISOString(),
          start_time: formData.startTime,
          end_time: formData.endTime,
          food_type: formData.foodCategories[0] || "OTHER",
          quantity: formData.quantity,
          quantity_remaining: formData.quantity,
          event_description: formData.eventDescription || null,
          event_tags: allTags,
        })
        .select()
        .single();

      if (eventError) {
        throw eventError;
      }

      // Upload images if any
      if (selectedImages.length > 0) {
        const uploadErrors: string[] = [];
        for (const file of selectedImages) {
          const imageFormData = new FormData();
          imageFormData.append("file", file);

          try {
            const imageResponse = await fetch(`/api/events/${event.id}/images`, {
              method: "POST",
              body: imageFormData,
              credentials: "include", // Include cookies for authentication
            });

            if (!imageResponse.ok) {
              let errorMessage = `Failed to upload ${file.name}`;
              let errorDetails: unknown = null;
              
              try {
                // Check if response has content
                const contentType = imageResponse.headers.get("content-type");
                const contentLength = imageResponse.headers.get("content-length");
                
                if (contentType?.includes("application/json") && contentLength !== "0") {
                  const text = await imageResponse.text();
                  if (text && text.trim()) {
                    errorDetails = JSON.parse(text);
                    const parsedDetails = errorDetails as Record<string, unknown>;
                    errorMessage =
                      (typeof parsedDetails.error === "string" && parsedDetails.error) ||
                      (typeof parsedDetails.message === "string" && parsedDetails.message) ||
                      errorMessage;
                  } else {
                    errorMessage = `${errorMessage}: ${imageResponse.status} ${imageResponse.statusText || "Unknown error"}`;
                  }
                } else {
                  // Try to get text response
                  const text = await imageResponse.text();
                  if (text && text.trim()) {
                    errorMessage = text;
                  } else {
                    errorMessage = `${errorMessage}: ${imageResponse.status} ${imageResponse.statusText || "Unknown error"}`;
                  }
                }
              } catch (parseError) {
                // If parsing fails, use status info
                errorMessage = `${errorMessage}: ${imageResponse.status} ${imageResponse.statusText || "Unknown error"}`;
                console.error("Error parsing response:", parseError);
              }
              
              uploadErrors.push(errorMessage);
              console.error("Failed to upload image:", {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                status: imageResponse.status,
                statusText: imageResponse.statusText,
                error: errorMessage,
                errorDetails: errorDetails,
                url: imageResponse.url,
              });
            } else {
              // Success - verify response
              try {
                const responseData = await imageResponse.json();
                console.log("Image uploaded successfully:", {
                  fileName: file.name,
                  response: responseData,
                });
              } catch {
                console.warn("Could not parse success response, but status was OK:", {
                  fileName: file.name,
                  status: imageResponse.status,
                });
              }
            }
          } catch (fileError) {
            const errorMsg = fileError instanceof Error ? fileError.message : `Failed to upload ${file.name}`;
            uploadErrors.push(errorMsg);
            console.error(`Error uploading ${file.name}:`, fileError);
          }
        }

        if (uploadErrors.length > 0) {
          alert(`Some images failed to upload:\n${uploadErrors.join("\n")}\n\nThe event was created, but you may want to add images later.`);
        }
      }

      setSelectedImages([]);
      
      // Trigger red confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5'], // Red color palette
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#DC2626', '#EF4444', '#F87171', '#FCA5A5'], // Red color palette
        });
      }, 250);

      alert("Event created successfully!");
      router.push("/events");
    } catch (error: unknown) {
      console.error("Error creating event:", error);
      const message = error instanceof Error ? error.message : "Failed to create event. Please try again.";
      alert(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
        <p className="text-gray-600 dark:text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!isOrganizer) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      <div className="pointer-events-none absolute bottom-0 right-[80px] hidden md:block" aria-hidden="true">
        <Image src="/terrier_4.png" alt="Boston terriers" width={200} height={200} priority />
      </div>
      <div className="mx-auto flex w-11/12 max-w-4xl flex-col pb-12 pt-10">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-slate-100">Post leftover food</h1>
          <p className="mt-3 text-xl italic text-gray-600 dark:text-slate-400">
            Share your event&apos;s extra servings so classmates can swing by before it&apos;s gone.
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
                      ? `${FOOD_CATEGORY_COLORS[category.value as FoodCategory]}20` // Light background for selected
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
              Images (up to 5, max 5MB each)
            </label>
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
              Optional, but photos help events stand out. JPEG, PNG, WebP, or GIF. You can add{" "}
              {Math.max(0, 5 - selectedImages.length)} more.
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
                      onClick={() => handleRemoveImage(index)}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 dark:hover:text-red-500 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Images upload once you submit this event.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 pt-4">
            <p className="text-sm text-gray-500 dark:text-slate-400">Posts go live instantly. Edit or delete from your profile anytime.</p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
