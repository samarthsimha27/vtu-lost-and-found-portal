import React, { useRef } from 'react';
import { CampusLocationRecord, MapMarkerPayload } from '../types';

export interface CampusMapSlotProps {
  markers: MapMarkerPayload[];
  locations: CampusLocationRecord[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
}

/**
 * Reusable map container component prepared for future Leaflet integration.
 * Receives normalized campus locations and geotagged item markers without rendering
 * a fake or non-functional map.
 */
export const CampusMapSlot: React.FC<CampusMapSlotProps> = ({
  markers,
  locations,
  center = { latitude: 15.7788, longitude: 74.4621 },
  zoom = 17
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const geotaggedCount = markers.filter((m) => m.hasExactGeotag).length;

  return (
    <section
      aria-label="Campus Map Integration Area"
      className="border-t border-[#E5DFD6] bg-[#F5F2EC]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
          <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#191816]">
            Campus Map Area
          </h2>
          <p className="text-xs text-[#625D55] tabular-nums">
            Prepared for Leaflet · {locations.length} campus locations · {markers.length} item records ({geotaggedCount} GPS-geotagged)
          </p>
        </div>

        {/* Dedicated Mount Container Reserved for Future Leaflet Instance */}
        <div
          id="vtu-leaflet-map-container"
          ref={mapContainerRef}
          data-map-center={`${center.latitude},${center.longitude}`}
          data-map-zoom={zoom}
          data-marker-count={markers.length}
          className="w-full min-h-[160px] rounded-xl border border-dashed border-[#CFC7B8] bg-[#FAF8F5] px-6 py-8 flex flex-col items-center justify-center text-center"
        >
          <p className="text-sm font-medium text-[#191816]">
            Reserved Space for Interactive Campus Map (Leaflet)
          </p>
          <p className="mt-1 text-xs text-[#625D55] max-w-md leading-relaxed">
            Location coordinates and geotagged camera captures are structured and ready to render as interactive markers here.
          </p>
        </div>
      </div>
    </section>
  );
};
