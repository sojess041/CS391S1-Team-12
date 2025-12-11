"use client";
import Image from "next/image";
import { useState, FormEvent, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { createEvent } from "@/lib/db";
import { EventFormData } from "@/types/form";
import Modal, { ModalType } from "@/components/modal";

const inputClasses =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-500 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition";
import { useState, FormEvent, ChangeEvent } from "react";
import { FormData } from "@/types/form";

const inputClasses =
  "w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-900 placeholder:text-gray-500 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition";

export default function Post() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<EventFormData>({
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: ModalType;
    title?: string;
    message: string;
  }>({
    isOpen: false,
    type: "error",
    message: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "quantity" ? Number(value) || 0 : value,
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Invalid File Type",
        message: "Please upload a JPEG, PNG, WebP, or GIF image.",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setModal({
        isOpen: true,
        type: "error",
        title: "File Too Large",
        message: "File size too large. Maximum size is 5MB.",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, eventImage: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(selectedFile.type)) {
        throw new Error("Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.");
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        throw new Error("File size too large. Maximum size is 5MB.");
      }

      // Generate unique filename
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload directly to Supabase Storage (uses authenticated session)
      const { data, error } = await supabase.storage
        .from("event-images")
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        });

      if (error) {
        console.error("Upload error:", error);
        throw new Error(error.message || "Failed to upload image");
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("event-images").getPublicUrl(data.path);

      return publicUrl;
    } catch (err: any) {
      console.error("Upload error:", err);
      setModal({
        isOpen: true,
        type: "error",
        title: "Upload Failed",
        message: err.message || "Failed to upload image. Please try again.",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }

      // Check if user is an organizer
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!userData || userData.role !== "organizer") {
        setModal({
          isOpen: true,
          type: "error",
          title: "Permission Denied",
          message: "Only organizers can create events. Please update your profile to organizer role.",
        });
        setSubmitting(false);
        return;
      }

      // Upload image if selected
      let imageUrl = formData.eventImage || null;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(user.id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSubmitting(false);
          return;
        }
      }

      // Parse date and time
      // eventDate from datetime-local is in format: YYYY-MM-DDTHH:MM
      // Extract date part and combine with start time for event_date
      // Use separate start_time and end_time inputs
      let eventDateStr = formData.eventDate;
      
      // Extract date part (YYYY-MM-DD) from datetime-local
      if (eventDateStr.includes("T")) {
        eventDateStr = eventDateStr.split("T")[0];
      }
      
      // Combine date with start time for event_date (TIMESTAMP WITH TIME ZONE)
      const startTime = formData.startTime || "00:00";
      const endTime = formData.endTime || "23:59";
      const eventDateTime = `${eventDateStr}T${startTime}:00`;

      // Parse tags
      const tags = formData.eventTags
        ? formData.eventTags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Create event
      await createEvent({
        organizer_id: user.id,
        event_name: formData.eventName,
        event_location: formData.eventLocation,
        room_number: formData.roomNumber || undefined,
        event_date: eventDateTime,
        start_time: startTime,
        end_time: endTime,
        food_type: formData.foodType,
        quantity: formData.quantity,
        event_description: formData.eventDescription || undefined,
        event_tags: tags,
        event_image: imageUrl || undefined,
      });

      // Show success message
      setModal({
        isOpen: true,
        type: "success",
        title: "Event Created!",
        message: "Your event has been posted successfully!",
      });
      // Redirect to events page after a short delay
      setTimeout(() => {
        router.push("/events");
      }, 1500);
    } catch (err: any) {
      console.error("Error creating event:", err);
      setModal({
        isOpen: true,
        type: "error",
        title: "Failed to Create Event",
        message: err.message || "Failed to create event. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
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

          <div className="w-full">
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
            <p className="mt-2 text-xs text-gray-500">Separate tags with commas</p>
          </div>

          <div className="w-full">
            <label htmlFor="eventImage" className="text-sm font-semibold text-gray-900">
              Event Image
            </label>
            <div className="mt-2 space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 rounded-full bg-red-600 p-2 text-white shadow-sm hover:bg-red-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-10 h-10 mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP (MAX. 5MB)</p>
                    </div>
                    <input
                      id="file-upload"
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
              {!imagePreview && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Or enter an image URL:</p>
                  <input
                    id="eventImage"
                    name="eventImage"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    value={formData.eventImage}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">Optional, but photos help events stand out.</p>
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
              disabled={submitting || uploading}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading image..." : submitting ? "Creating event..." : "Post event"}
              className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-red-500"
            >
              Post event
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
