import Image from "next/image";
import Link from "next/link";
import { EventCardProps } from "@/types/event";
import { FaLocationDot, FaRegBookmark, FaUtensils } from "react-icons/fa6";
import { LuCalendarClock } from "react-icons/lu";

export default function EventCard({
  id,
  eventName,
  organizerName,
  eventLocation,
  roomNumber,
  eventDate,
  startTime,
  endTime,
  foodType,
  quantity,
  quantityRemaining,
  eventDescription,
  eventTags,
  eventImage,
}: EventCardProps) {
  const tryFormatDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(parsed);
  };

  const tryFormatTime = (timeString: string) => {
    const parsed = new Date(`1970-01-01T${timeString}`);
    if (Number.isNaN(parsed.getTime())) return timeString;
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(parsed);
  };

  const formattedDate = tryFormatDate(eventDate);
  const formattedStart = tryFormatTime(startTime);
  const formattedEnd = tryFormatTime(endTime);
  const descriptionPreview =
    eventDescription && eventDescription.length > 110 ? `${eventDescription.slice(0, 107)}...` : eventDescription;
  const descriptionText = descriptionPreview ?? "";
  const displayLocation = eventLocation.length > 28 ? `${eventLocation.slice(0, 27)}...` : eventLocation;
  const displayRoom = roomNumber ? `Room ${roomNumber}` : null;

  return (
    <article className="overflow-hidden rounded-3xl bg-transparent shadow-xl flex flex-col h-full">
      <div className="relative aspect-[4/3]">
        {eventImage ? (
          <Image
            src={eventImage}
            alt={eventName}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <rect x="0" y="0" width="100" height="100" className="fill-gray-200 dark:fill-gray-800" />
            <line x1="0" y1="0" x2="100" y2="100" stroke="#bdbdbd" strokeWidth="1" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="#bdbdbd" strokeWidth="1" />
          </svg>
        )}
      </div>

      <div className="px-10 py-3 -translate-x-5 flex flex-col flex-1">
        <div className="my-2 flex items-start justify-between gap-3">
          <Link
            href={id ? `/events/${id}` : "#"}
            className="text-2xl font-extrabold leading-tight text-black min-h-[56px] flex-1 hover:text-red-600 transition cursor-pointer"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {eventName}
          </Link>
          <h3
            className="text-2xl font-extrabold leading-tight text-black min-h-[56px] flex-1"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
          >
            {eventName}
          </h3>
          <button type="button" aria-label="Bookmark event">
            <FaRegBookmark className="h-8 w-8 text-black hover:fill-red-600" />
          </button>
        </div>

        <div className="min-h-[20px] flex items-center">
          {organizerName && <p className="text-base font-medium text-black">{organizerName}</p>}
        </div>
        <div className="mt-1 text-sm text-black min-h-[40px] flex gap-2 items-start">
          <FaLocationDot className="mt-0.5 shrink-0" />
          <div className="flex-1 space-y-0.5 leading-snug min-h-[32px] flex flex-col justify-between">
            <p className="truncate">{displayLocation}</p>
            <p>{displayRoom ?? "\u00A0"}</p>
          </div>
        </div>
        <div className="mt-1 text-sm text-black min-h-[28px] flex gap-2 items-start">
          <LuCalendarClock className="mt-0.5 shrink-0" />
          <p className="leading-tight min-h-[18px] flex items-center">
            {formattedDate} · {formattedStart} - {formattedEnd}
          </p>
        </div>

        <div className="mt-3 space-y-1">
          <p className="flex items-center gap-2 text-base font-semibold text-black">
            <FaUtensils className="h-5 w-5 shrink-0" />
            {foodType}
          </p>
          <p className="mt-1 text-sm text-black">
            {quantityRemaining} of {quantity} servings remaining
          </p>
          <p className="mt-2 text-sm text-gray-600 min-h-[54px] leading-snug">{descriptionText}</p>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          {Array.isArray(eventTags) && eventTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {eventTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <Link
            href={id ? `/events/${id}` : "/events"}
            href="/events"
            className="ml-auto rounded-xl translate-x-6 bg-red-600 px-6 py-2 font-semibold text-white shadow-sm transition hover:scale-105"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}
