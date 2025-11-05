import Image from "next/image";
import { EventCardProps } from "@/types/event";
import { FaLocationDot, FaRegBookmark, FaUtensils } from "react-icons/fa6";

export default function EventCard({
  eventName,
  organizerName,
  location,
  foodType,
  timeframe,
  quantity,
  image,
  tags,
}: EventCardProps) {
  return (
    <article className="overflow-hidden rounded-3xl bg-transparent shadow-xl m-3">
      <div className="relative aspect-[4/3]">
        {image ? (
          <Image
            src={image}
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

      <div className="px-10 py-3 -translate-x-5">
        <div className="my-2 flex items-start justify-between">
          <h3 className="text-2xl font-extrabold leading-tight text-black">{eventName}</h3>
          <button type="button" aria-label="Bookmark event">
            <FaRegBookmark className="h-8 w-8 translate-x-10 text-black hover:fill-red-600" />
          </button>
        </div>

        <p className="text-base font-medium text-black">{organizerName}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-black">
          <FaLocationDot />
          {location}
        </p>

        <div className="mt-3">
          <p className="flex items-center gap-2 text-base font-semibold text-black">
            <FaUtensils />
            {foodType}
          </p>
          <p className="mt-1 text-sm text-black">Available from {timeframe}</p>
          <p className="mt-1 text-sm text-black">Quantity Remaining: {quantity}</p>
        </div>

        <div className="mt-4 flex items-center">
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            className="ml-auto rounded-xl translate-x-6 bg-red-600 px-6 py-2 font-semibold text-white shadow-sm hover:scale-105 duration-300"
          >
            View
          </button>
        </div>
      </div>
    </article>
  );
}
