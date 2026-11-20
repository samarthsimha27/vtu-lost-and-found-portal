import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CampusLocation, CampusLocationRecord, MapMarkerPayload } from '../types';
import {
  MapPin,
  Compass,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Building2,
  Package,
  Search
} from 'lucide-react';

export interface CampusMapSlotProps {
  markers: MapMarkerPayload[];
  locations: CampusLocationRecord[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  onSelectItem?: (id: string) => void;
  onSelectLocation?: (location: CampusLocation) => void;
}

type MapFilterMode = 'all' | 'landmarks' | 'found' | 'lost';

export const CampusMapSlot: React.FC<CampusMapSlotProps> = ({
  markers,
  locations,
  center = { latitude: 15.7788, longitude: 74.4621 },
  zoom = 17,
  onSelectItem,
  onSelectLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    landmarks: L.LayerGroup;
    found: L.LayerGroup;
    lost: L.LayerGroup;
  }>({
    landmarks: L.layerGroup(),
    found: L.layerGroup(),
    lost: L.layerGroup()
  });

  const [filterMode, setFilterMode] = useState<MapFilterMode>('all');
  const [activeItemCount, setActiveItemCount] = useState(markers.length);

  const geotaggedCount = markers.filter((m) => m.hasExactGeotag).length;
  const foundCount = markers.filter((m) => m.kind === 'found_report').length;
  const lostCount = markers.filter((m) => m.kind !== 'found_report').length;

  // Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Prevent duplicate map initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [center.latitude, center.longitude],
      zoom: zoom,
      scrollWheelZoom: false,
      zoomControl: true
    });

    // Add high-resolution OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors · VTU Belagavi'
    }).addTo(map);

    // Initialize layer groups and add them to map
    const landmarksGroup = L.layerGroup().addTo(map);
    const foundGroup = L.layerGroup().addTo(map);
    const lostGroup = L.layerGroup().addTo(map);

    layersRef.current = {
      landmarks: landmarksGroup,
      found: foundGroup,
      lost: lostGroup
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [center.latitude, center.longitude, zoom]);

  // Update Markers when data or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const { landmarks: landmarksGroup, found: foundGroup, lost: lostGroup } = layersRef.current;

    // Clear previous markers
    landmarksGroup.clearLayers();
    foundGroup.clearLayers();
    lostGroup.clearLayers();

    // 1. Plot Campus Landmarks
    locations.forEach((loc) => {
      const itemsAtLocation = markers.filter((m) => m.locationName === loc.name);
      const landmarkIcon = L.divIcon({
        className: 'custom-landmark-marker',
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #0F172A;
            color: #FFFFFF;
            padding: 5px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(15,23,42,0.3);
            border: 2px solid #FFFFFF;
            white-space: nowrap;
            cursor: pointer;
            transition: transform 0.15s ease;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 21h18"/>
              <path d="M3 10h18"/>
              <path d="M5 6l7-3 7 3"/>
              <path d="M4 10v11"/>
              <path d="M20 10v11"/>
              <path d="M8 14v3"/>
              <path d="M12 14v3"/>
              <path d="M16 14v3"/>
            </svg>
            <span>${loc.name}</span>
            ${
              itemsAtLocation.length > 0
                ? `<span style="background: #DF6A18; color: #FFF; border-radius: 9999px; padding: 1px 6px; font-size: 10px; font-weight: 800;">${itemsAtLocation.length}</span>`
                : ''
            }
          </div>
        `,
        iconSize: [110, 28],
        iconAnchor: [55, 14],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([loc.defaultCoordinates.latitude, loc.defaultCoordinates.longitude], {
        icon: landmarkIcon
      });

      // Construct interactive popup element
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 font-sans text-[#191816]';
      popupDiv.innerHTML = `
        <div style="margin-bottom: 6px;">
          <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #625D55; font-weight: 700;">Campus Landmark</div>
          <div style="font-size: 14px; font-weight: 700; color: #0F172A; margin-top: 2px;">${loc.name}</div>
          <div style="font-size: 11px; color: #625D55; margin-top: 2px;">
            GPS: ${loc.defaultCoordinates.latitude.toFixed(4)}°N, ${loc.defaultCoordinates.longitude.toFixed(4)}°E
          </div>
        </div>
        <div style="font-size: 12px; color: #374151; padding: 6px 8px; background: #F3EFE9; border-radius: 6px; margin-bottom: 8px;">
          ${
            itemsAtLocation.length > 0
              ? `<strong>${itemsAtLocation.length}</strong> lost & found item(s) reported here.`
              : `No active items reported here yet.`
          }
        </div>
      `;

      if (onSelectLocation) {
        const filterBtn = document.createElement('button');
        filterBtn.textContent = `View Items at ${loc.name}`;
        filterBtn.style.cssText =
          'width: 100%; padding: 6px 10px; background: #146B32; color: #FFF; font-size: 11px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; text-align: center;';
        filterBtn.onclick = () => {
          onSelectLocation(loc.name);
          map.closePopup();
        };
        popupDiv.appendChild(filterBtn);
      }

      marker.bindPopup(popupDiv, { maxWidth: 240 });
      landmarksGroup.addLayer(marker);
    });

    // 2. Plot Lost & Found Items
    markers.forEach((item) => {
      const isFound = item.kind === 'found_report';
      const badgeBg = isFound ? '#146B32' : '#DF6A18';
      const label = isFound ? 'FOUND' : 'LOST';

      // Slight jitter if exact coordinate matches building center so multiple items don't hide each other
      const latJitter = (Math.random() - 0.5) * 0.00015;
      const lngJitter = (Math.random() - 0.5) * 0.00015;
      const targetLat = item.hasExactGeotag ? item.coordinates.latitude : item.coordinates.latitude + latJitter;
      const targetLng = item.hasExactGeotag ? item.coordinates.longitude : item.coordinates.longitude + lngJitter;

      const itemIcon = L.divIcon({
        className: 'custom-item-marker',
        html: `
          <div style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: ${badgeBg};
              color: #FFFFFF;
              padding: 4px 8px;
              border-radius: 8px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.03em;
              box-shadow: 0 4px 14px rgba(0,0,0,0.3);
              border: 2px solid #FFFFFF;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #FFF;"></span>
              <span>${label}</span>
              ${item.hasExactGeotag ? `<span title="GPS Geotagged" style="font-size: 10px;">📍</span>` : ''}
            </div>
            <div style="
              position: absolute;
              bottom: -5px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 4px solid transparent;
              border-right: 4px solid transparent;
              border-top: 5px solid ${badgeBg};
            "></div>
          </div>
        `,
        iconSize: [60, 26],
        iconAnchor: [30, 26],
        popupAnchor: [0, -28]
      });

      const marker = L.marker([targetLat, targetLng], { icon: itemIcon });

      // Construct popup content with details and action button
      const popupDiv = document.createElement('div');
      popupDiv.className = 'font-sans text-[#191816]';
      popupDiv.style.cssText = 'max-width: 220px;';

      const imageHtml = item.imageUrl
        ? `<div style="margin-bottom: 8px; border-radius: 6px; overflow: hidden; height: 90px; background: #F3EFE9;">
             <img src="${item.imageUrl}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
           </div>`
        : '';

      const geotagBadgeHtml = item.hasExactGeotag
        ? `<div style="display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 700; color: #146B32; background: #EDF6F0; padding: 2px 6px; border-radius: 9999px; margin-bottom: 6px;">
             <span>✓ GPS Camera Verified</span>
           </div>`
        : '';

      popupDiv.innerHTML = `
        ${imageHtml}
        <div style="margin-bottom: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 2px;">
            <span style="font-size: 10px; font-weight: 800; color: ${badgeBg}; text-transform: uppercase;">
              ${isFound ? 'Found Item' : 'Lost Report'}
            </span>
            <span style="font-size: 9px; color: #625D55; background: #F3EFE9; padding: 1px 5px; border-radius: 4px;">
              ${item.status}
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #191816; line-height: 1.3;">
            ${item.title}
          </div>
        </div>
        ${geotagBadgeHtml}
        <div style="font-size: 11px; color: #625D55; margin-bottom: 8px;">
          <div>📍 <strong>${item.locationName}</strong></div>
          <div>📅 ${item.dateLost}</div>
        </div>
      `;

      if (onSelectItem) {
        const detailBtn = document.createElement('button');
        detailBtn.textContent = 'View Item Details';
        detailBtn.style.cssText =
          'width: 100%; padding: 6px 10px; background: #191816; color: #FFF; font-size: 11px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; text-align: center;';
        detailBtn.onclick = () => {
          onSelectItem(item.id);
          map.closePopup();
        };
        popupDiv.appendChild(detailBtn);
      }

      marker.bindPopup(popupDiv, { maxWidth: 240 });

      if (isFound) {
        foundGroup.addLayer(marker);
      } else {
        lostGroup.addLayer(marker);
      }
    });

    // Update filter visibility
    if (filterMode === 'landmarks') {
      map.addLayer(landmarksGroup);
      map.removeLayer(foundGroup);
      map.removeLayer(lostGroup);
    } else if (filterMode === 'found') {
      map.removeLayer(landmarksGroup);
      map.addLayer(foundGroup);
      map.removeLayer(lostGroup);
    } else if (filterMode === 'lost') {
      map.removeLayer(landmarksGroup);
      map.removeLayer(foundGroup);
      map.addLayer(lostGroup);
    } else {
      map.addLayer(landmarksGroup);
      map.addLayer(foundGroup);
      map.addLayer(lostGroup);
    }

    setActiveItemCount(markers.length);
  }, [markers, locations, filterMode, onSelectItem, onSelectLocation]);

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([center.latitude, center.longitude], zoom, {
      animate: true
    });
  };

  return (
    <section
      aria-label="Campus Interactive Map Section"
      className="border-t border-[#E5DFD6] bg-[#F5F2EC]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EDF6F0] text-[#146B32] border border-[#CDE5D5]">
                <Compass className="w-3.5 h-3.5" />
                Live GPS Map
              </span>
              <span className="text-xs text-[#625D55]">Visvesvaraya Technological University, Belagavi</span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#191816]">
              Interactive Campus Recovery Map
            </h2>
          </div>

          {/* Quick Filter Buttons & Recenter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg bg-white border border-[#E5DFD6] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#191816] text-white'
                    : 'text-[#625D55] hover:text-[#191816]'
                }`}
              >
                All Markers
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('found')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMode === 'found'
                    ? 'bg-[#146B32] text-white'
                    : 'text-[#625D55] hover:text-[#146B32]'
                }`}
              >
                Found ({foundCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('lost')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMode === 'lost'
                    ? 'bg-[#DF6A18] text-white'
                    : 'text-[#625D55] hover:text-[#DF6A18]'
                }`}
              >
                Lost ({lostCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('landmarks')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterMode === 'landmarks'
                    ? 'bg-[#0F172A] text-white'
                    : 'text-[#625D55] hover:text-[#0F172A]'
                }`}
              >
                Buildings ({locations.length})
              </button>
            </div>

            <button
              type="button"
              onClick={handleRecenter}
              title="Reset view to VTU Campus Center"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5DFD6] hover:border-[#C5BCB0] text-[#191816] rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#625D55]" />
              <span>Center Campus</span>
            </button>
          </div>
        </div>

        {/* Leaflet Map Mount Container */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-[#E5DFD6] shadow-md bg-[#FAF8F5]">
          <div
            id="vtu-leaflet-map-container"
            ref={mapContainerRef}
            className="w-full h-[460px] sm:h-[520px] z-0"
            style={{ background: '#E2E8F0' }}
          />

          {/* Map Legend Bar Overlaid at Bottom */}
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-white/95 backdrop-blur-md border border-[#E5DFD6] rounded-xl px-3.5 py-2 shadow-lg z-[1000] flex items-center gap-4 text-xs flex-wrap">
            <span className="font-semibold text-[#191816] text-[11px] uppercase tracking-wider">
              Map Legend:
            </span>
            <div className="flex items-center gap-1.5 text-[#1E3A8A]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A] border border-white"></span>
              <span className="font-medium text-[#191816]">Landmarks ({locations.length})</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#146B32]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#146B32] border border-white"></span>
              <span className="font-medium text-[#191816]">Found Items ({foundCount})</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#DF6A18]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DF6A18] border border-white"></span>
              <span className="font-medium text-[#191816]">Lost Reports ({lostCount})</span>
            </div>
            {geotaggedCount > 0 && (
              <div className="flex items-center gap-1 text-[#625D55]">
                <span>📍</span>
                <span>{geotaggedCount} Camera Geotagged</span>
              </div>
            )}
          </div>
        </div>

        {/* Helpful Footnote */}
        <p className="mt-2.5 text-xs text-[#625D55] text-center sm:text-left">
          💡 Click on any building badge or item pin on the map to see reports, photos, and exact coordinates.
        </p>
      </div>
    </section>
  );
};
