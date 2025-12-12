"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// Dynamically import the map component to avoid SSR issues
const LeafletMapInner = dynamic(() => import("./leaflet-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-lg">
      <p className="text-gray-600 dark:text-slate-400">Loading map...</p>
    </div>
  ),
});

export default function CampusMap() {
  const [mapError, setMapError] = useState<string | null>(null);

  if (mapError) {
    return (
      <div className="flex h-[500px] items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{mapError}</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
      <LeafletMapInner onError={setMapError} />
    </div>
  );
}

