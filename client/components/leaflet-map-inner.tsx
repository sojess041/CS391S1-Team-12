"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/lib/supabase";
import { Location } from "@/types/database";

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LeafletMapInnerProps {
  onError?: (error: string) => void;
}

export default function LeafletMapInner({ onError }: LeafletMapInnerProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .eq("is_active", true);

        if (error) {
          console.error("Error fetching locations:", error);
          onError?.(error.message);
          return;
        }

        setLocations(data || []);
      } catch (err) {
        console.error("Error fetching locations:", err);
        onError?.("Failed to load map locations");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [onError]);

  // BU campus center coordinates
  const center: [number, number] = [42.3505, -71.1054];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-slate-800">
        <p className="text-gray-600 dark:text-slate-400">Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold">{location.name}</h3>
              <p className="text-gray-600">{location.type}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

