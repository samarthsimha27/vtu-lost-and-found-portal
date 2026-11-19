export const CAMPUS_LOCATIONS = [
  'Sports Complex',
  'Basketball Court',
  'Ground',
  'Boys’ Mess',
  'Girls’ Mess',
  'Administrative Department',
  'Regional Office / CUE Department',
  'Mechanical and MEA Department',
  'Xerox Shop',
  'Kateel Canteen',
  'Vidya Bhavan'
] as const;

export type CampusLocation = (typeof CAMPUS_LOCATIONS)[number];

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export interface CampusLocationRecord {
  id: string;
  name: CampusLocation;
  defaultCoordinates: GeoCoordinates;
}

/**
 * Reusable geotagged image structure designed for both form attachments
 * and future Leaflet map marker + image popup integration.
 */
export interface GeotaggedImage {
  imageUrl: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  capturedAt: string; // ISO-8601 timestamp
  source: 'camera' | 'upload';
}

export type IllustrationType =
  | 'calculator'
  | 'id_card'
  | 'notebook'
  | 'electronics'
  | 'keys'
  | 'drafter'
  | 'watch';

export type RecordKind = 'lost_report' | 'find_request' | 'found_report';

export type ItemStatus = 'Active' | 'Claimed' | 'Returned' | 'Archived';

export interface LostItemRecord {
  id: string;
  kind: RecordKind;
  name: string;
  description: string;
  status: ItemStatus;
  imageUrl?: string;
  geotag?: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    capturedAt?: string;
  };
  location: CampusLocation;
  locationCoordinates: GeoCoordinates;
  dateLost: string; // YYYY-MM-DD
  contactName: string;
  contactInfo: string;
  createdAt: number;
  illustrationType: IllustrationType;
}

/**
 * Normalized marker payload prepared for future Leaflet integration.
 */
export interface MapMarkerPayload {
  id: string;
  kind: RecordKind;
  title: string;
  status: ItemStatus;
  locationName: CampusLocation;
  coordinates: GeoCoordinates;
  hasExactGeotag: boolean;
  imageUrl?: string;
  capturedAt?: string;
  dateLost: string;
}
