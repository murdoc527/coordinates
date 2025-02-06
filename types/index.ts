export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
}
