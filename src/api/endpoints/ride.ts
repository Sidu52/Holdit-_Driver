import { api, ApiError } from "../client";

export interface RideRequest {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  pickup: {
    address: string;
    coordinates: [number, number] | null;
  };
  dropoff: {
    address: string;
    coordinates: [number, number] | null;
  };
  status: string;
  fare: number;
  distance: number;
  expiresAt?: string;
  expiresInSeconds?: number;
  attemptNumber?: number;
  type?: string;
  storeDetails?: {
    name: string;
    address: string;
  };
}

const getCoordinates = (location: any): [number, number] | null => {
  if (Array.isArray(location?.coordinates) && location.coordinates.length >= 2) {
    return [Number(location.coordinates[0]), Number(location.coordinates[1])];
  }

  if (location?.lng != null && location?.lat != null) {
    return [Number(location.lng), Number(location.lat)];
  }

  return null;
};

const getAddress = (location: any) => {
  return location?.address || location?.formattedAddress || location?.name || "Location not available";
};

export const normalizeRideOffer = (payload: any): RideRequest => {
  const booking = payload?.booking || payload;
  const offer = payload?.offer || payload;
  const bookingId = booking?._id || offer?.bookingId || payload?.bookingId;
  const pickupLocation = booking?.pickupLocation || payload?.pickupLocation || booking?.pickup?.location;
  const dropoffLocation = booking?.deliveryLocation || payload?.deliveryLocation || booking?.dropoff || booking?.dropLocation;
  const user = booking?.userId || booking?.user || null;
  const store = booking?.storeId || booking?.storeDetails || null;
  const pricing = booking?.pricing || {};

  return {
    _id: bookingId,
    user: user
      ? {
          _id: user._id || "",
          firstName: user.first_name || user.firstName || "",
          lastName: user.last_name || user.lastName || "",
          phone: user.phone || "",
        }
      : null,
    pickup: {
      address: getAddress(pickupLocation),
      coordinates: getCoordinates(pickupLocation),
    },
    dropoff: {
      address: getAddress(dropoffLocation),
      coordinates: getCoordinates(dropoffLocation),
    },
    status: booking?.status || "offered",
    fare: Number(pricing?.total || pricing?.fare || booking?.fare || payload?.fare || 0),
    distance: Number(booking?.distance || payload?.distance || 0),
    expiresInSeconds: Number(offer?.expiresInSeconds || payload?.expiresInSeconds || 0),
    attemptNumber: Number(offer?.attemptNumber || payload?.attemptNumber || 1),
    type: payload?.type || offer?.type,
    storeDetails: store
      ? {
          name: store.store_name || store.name || "Pickup Request",
          address: getAddress(store.location || store),
        }
      : undefined,
  };
};

export const getPendingOffer = async (): Promise<RideRequest[]> => {
  try {
    const response = await api.get("/driver/rides/offer/pending");
    return [normalizeRideOffer(response.data.data)];
  } catch (error) {
    if ((error as ApiError)?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const getAssignedRides = async (): Promise<RideRequest[]> => {
  const response = await api.get("/driver/rides/assigned");
  return response.data.data;
};

export const getActiveRide = async () => {
  const response = await api.get("/driver/rides/active");
  return response.data.data;
};

export interface RideHistoryResponse {
  rides: RideRequest[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const getRideHistory = async (): Promise<RideHistoryResponse> => {
  const response = await api.get("/driver/rides/history");
  return response.data.data;
};

export const getRideDetails = async (bookingId: string): Promise<RideRequest> => {
  const response = await api.get(`/driver/rides/${bookingId}`);
  return response.data.data;
};

export const acceptRide = async (bookingId: string) => {
  const response = await api.post(`/driver/rides/${bookingId}/accept`);
  return response.data;
};

export const rejectRide = async (bookingId: string) => {
  const response = await api.post(`/driver/rides/${bookingId}/reject`);
  return response.data;
};

export const arriveAtPickup = async (bookingId: string) => {
  const response = await api.put(`/driver/rides/${bookingId}/arrive-pickup`);
  return response.data;
};

export const completePickup = async (bookingId: string, data?: any) => {
  const response = await api.put(`/driver/rides/${bookingId}/complete-pickup`, data);
  return response.data;
};

export const arriveAtStore = async (bookingId: string) => {
  const response = await api.put(`/driver/rides/${bookingId}/arrive-store`);
  return response.data;
};

export const cancelRide = async (bookingId: string, reason?: string) => {
  const response = await api.post(`/driver/rides/${bookingId}/cancel`, { reason });
  return response.data;
};

export const arriveAtDelivery = async (bookingId: string) => {
  const response = await api.put(`/driver/rides/${bookingId}/arrive-delivery`);
  return response.data;
};

export const completeDelivery = async (bookingId: string, data?: any) => {
  const response = await api.put(`/driver/rides/${bookingId}/complete-delivery`, data);
  return response.data;
};