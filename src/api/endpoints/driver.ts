import { api } from "../client";

export interface DriverProfile {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  is_online: boolean;
  is_signup: boolean;
  isVerified: boolean;
  vehicle_type?: string;
  vehicleDetails?: {
    type: string;
    make: string;
    model: string;
    licensePlate: string;
  };
  rating: number;
  totalDeliveries: number;
  earnings: {
    availableBalance: number;
    today: number;
    thisWeek: number;
  };
}

export interface DriverStats {
  availableBalance: number;
  earningsToday: number;
  earningsThisWeek: number;
  totalDeliveries: number;
  rating: number;
  weeklyChart: { day: string; amount: number }[];
}

export const getDriverProfile = async (): Promise<DriverProfile> => {
  const response = await api.get("/driver/");
  return response.data.data.driver;
};

export const getDriverStats = async (): Promise<DriverStats> => {
  const response = await api.get("/driver/stats");
  return response.data.data;
};

export const updateDriverInfo = async (data: Partial<DriverProfile>) => {
  const response = await api.put("/driver/update-driver-info", data);
  return response.data;
};

export const updateDriverLocation = async (data: { lat: number; lng: number }) => {
  const response = await api.put("/driver/update-driver-location", data);
  return response.data;
};

export const updateDriverStatus = async (is_online: boolean) => {
  const response = await api.put("/driver/update-driver-status", { is_online });
  return response.data;
};
