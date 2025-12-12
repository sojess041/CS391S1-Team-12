"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import { Location } from "@/types/database";

// Dynamically import map to avoid SSR issues
const CampusMap = dynamic(() => import("@/components/campus-map"), {
  ssr: false,
});

export default function MapPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (error) {
          console.error("Error fetching locations:", error);
        } else {
          setLocations(data || []);
        }
      } catch (err) {
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filteredLocations = locations.filter((location) =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 px-4 py-8 transition-colors duration-300">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-semibold text-gray-900 dark:text-slate-100">
            Campus Map
          </h1>
          <p className="mt-2 text-gray-600 dark:text-slate-400">
            Find food locations around BU campus
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Search locations
          </label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name..."
            className="w-full rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-gray-900 dark:text-slate-100 placeholder:text-gray-500 dark:placeholder:text-slate-400 focus:border-red-400 dark:focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20"
          />
        </div>

        <div className="mb-6">
          <CampusMap />
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Locations ({filteredLocations.length})
          </h2>
          {loading ? (
            <p className="text-gray-600 dark:text-slate-400">Loading locations...</p>
          ) : filteredLocations.length === 0 ? (
            <p className="text-gray-600 dark:text-slate-400">No locations found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLocations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 p-4"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-slate-100">
                    {location.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    {location.type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-2">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

