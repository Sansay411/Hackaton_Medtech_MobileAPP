export interface Clinic {
  id: string;
  name: string;
  price: number;
  address: string;
  district: string;
  distance: string;
  osms: boolean;
  updated: string;
  phone: string;
  rating: number;
}

export interface MapMarker {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  address: string;
  osms: boolean;
}

export interface OnboardingState {
  city: string;
  intent: string;
  phone: string;
  isCompleted: boolean;
}

export interface SearchResponse {
  insights: string;
  clinics: Clinic[];
}
