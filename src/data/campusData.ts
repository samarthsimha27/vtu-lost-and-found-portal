import {
  CampusLocation,
  CampusLocationRecord,
  GeoCoordinates,
  IllustrationType,
  LostItemRecord
} from '../types';

/**
 * Structured campus location directory with reference coordinates on VTU campus
 * ready for future Leaflet marker plotting.
 */
export const CAMPUS_LOCATION_DIRECTORY: Record<CampusLocation, CampusLocationRecord> = {
  'Sports Complex': {
    id: 'loc-sports-complex',
    name: 'Sports Complex',
    defaultCoordinates: { latitude: 15.779515, longitude: 74.461869 }
  },
  'Basketball Court': {
    id: 'loc-basketball-court',
    name: 'Basketball Court',
    defaultCoordinates: { latitude: 15.779581, longitude: 74.461533 }
  },
  Ground: {
    id: 'loc-ground',
    name: 'Ground',
    defaultCoordinates: { latitude: 15.780445, longitude: 74.460139 }
  },
  'Boys’ Mess': {
    id: 'loc-boys-mess',
    name: 'Boys’ Mess',
    defaultCoordinates: { latitude: 15.778999, longitude: 74.460682 }
  },
  'Girls’ Mess': {
    id: 'loc-girls-mess',
    name: 'Girls’ Mess',
    defaultCoordinates: { latitude: 15.777189, longitude: 74.463905 }
  },
  'Administrative Department': {
    id: 'loc-admin-dept',
    name: 'Administrative Department',
    defaultCoordinates: { latitude: 15.777948, longitude: 74.462541 }
  },
  'Regional Office / CUE Department': {
    id: 'loc-regional-cue',
    name: 'Regional Office / CUE Department',
    defaultCoordinates: { latitude: 15.777532, longitude: 74.464599 }
  },
  'Mechanical and MEA Department': {
    id: 'loc-mech-mea',
    name: 'Mechanical and MEA Department',
    defaultCoordinates: { latitude: 15.77941, longitude: 74.462423 }
  },
  'Xerox Shop': {
    id: 'loc-xerox-shop',
    name: 'Xerox Shop',
    defaultCoordinates: { latitude: 15.777736, longitude: 74.463428 }
  },
  'Kateel Canteen': {
    id: 'loc-kateel-canteen',
    name: 'Kateel Canteen',
    defaultCoordinates: { latitude: 15.77747, longitude: 74.461761 }
  },
  'Vidya Bhavan': {
    id: 'loc-vidya-bhavan',
    name: 'Vidya Bhavan',
    defaultCoordinates: { latitude: 15.777818, longitude: 74.465171 }
  }
};

export function getCoordinatesForLocation(location: CampusLocation): GeoCoordinates {
  return CAMPUS_LOCATION_DIRECTORY[location].defaultCoordinates;
}

export function inferIllustrationType(itemName: string, description: string): IllustrationType {
  const text = `${itemName} ${description}`.toLowerCase();
  if (text.includes('calculator') || text.includes('casio')) return 'calculator';
  if (
    text.includes('id') ||
    text.includes('card') ||
    text.includes('ticket') ||
    text.includes('wallet')
  ) {
    return 'id_card';
  }
  if (
    text.includes('note') ||
    text.includes('book') ||
    text.includes('record') ||
    text.includes('journal') ||
    text.includes('file')
  ) {
    return 'notebook';
  }
  if (text.includes('key')) return 'keys';
  if (text.includes('drafter') || text.includes('scale')) return 'drafter';
  if (
    text.includes('watch') ||
    text.includes('bottle') ||
    text.includes('umbrella') ||
    text.includes('glasses')
  ) {
    return 'watch';
  }
  return 'electronics';
}

export const SAMPLE_CAMPUS_ITEMS: LostItemRecord[] = [];

export const INITIAL_LOST_ITEMS: LostItemRecord[] = [];

export const INITIAL_FIND_REQUESTS: LostItemRecord[] = [];
