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
  anomalous_inflation?: boolean;
  parsedAt?: string;
}

export interface MapMarker {
  id: string;
  name: string;
  price: number;
  lat: number;
  lng: number;
  address: string;
  osms: boolean;
  rating?: number;
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

export interface BlogPost {
  id: string;
  title: string;
  summary: string;
  category: string;
  city: string;
  author: string;
  imageUrl: string;
  content: string;
  publishedAt: string;
  views: number;
  likes: number;
}
