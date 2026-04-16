export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// AUTH
export interface LoginResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse {
  isFirstLogin: boolean;
  needsOnboarding: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface CompleteProfilePayload {
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  dob: string;
  address: string;
  lat: number;
  lng: number;
}

export interface CompleteProfileResponse {
  driver: any;
  isServiceable: boolean;
  serviceMessage?: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message: string;
}

// STORE
export interface Store {
  _id: string;
  store_name: string;
  store_address: string;
  store_open_time: string;
  store_close_time: string;
  store_description: string;
  store_contact_number: string;
  location: {
    type: string;
    coordinates: [number, number];
  };
  is_online: boolean;
  verification_status: string;
  status: string;
  rating: number;

  distance?: number;
}

export interface NearestStoreResponse {
  nearest: Store;
  alternatives: Store[];
  total: number;
}

// BOOKING
export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Luggage {
  small?: number;
  medium?: number;
  large?: number;
  other?: number;
}

export interface TimelineEntry {
  status: string;
  note: string;
  timestamp: string;
}

export interface Booking {
  _id: string;
  userId: string;
  status: string;
  bookingCode?: string; // Optional booking code for display
  pickupLocation: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  luggage: Luggage & { totalBags: number };
  pickup: {
    scheduledAt: string;
    assignment?: {
      driverId: string;
      assignedAt: string;
      startedAt?: string;
      completedAt?: string;
    };
  };
  storeId?: string;
  store?: {
    _id: string;
    store_name: string;
    store_address: string;
    store_contact_number: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
  };
  driver?: {
    _id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
  pricing: {
    currency: string;
    baseFare: number;
    serviceFee: number;
    storageFee: number;
    total: number;
  };
  returnLocation?: {
    type: string;
    coordinates: [number, number];
    address: string;
  };
  return?: {
    scheduledAt: string;
    requestedAt: string;
    notes: string;
  };
  cancellation?: {
    reason: string;
    cancelledBy: string;
    cancelledAt: string;
    refundAmount?: number;
    refundStatus?: string;
  };
  timeline: TimelineEntry[];
  notes: string;
  createdAt: string;
}

export interface BookingListResponse {
  bookings: Booking[];
  pagination: Pagination;
}

export interface SchedulePickupPayload {
  pickupLocation: Location;
  luggage: Luggage;
  notes?: string;
  tipAmount?: number;
  coupenCode?: string;
}

export interface SchedulePickupResponse {
  bookingId: string;
  status: string;
  scheduledAt: string;
  totalBags: number;
}

export interface CancelBookingPayload {
  reason: string;
}

export interface RequestReturnPayload {
  returnLocation: Location;
  returnScheduledAt: string;
  notes?: string;
}

export interface RequestReturnResponse {
  bookingId: string;
  status: string;
  returnScheduledAt: string;
}

export interface BookingQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  sort_order?: "asc" | "desc";
}

// PROFILE UPDATE
export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  gender?: string;
  dob?: string;
  address?: string;
  lat?: number;
  lng?: number;
}
