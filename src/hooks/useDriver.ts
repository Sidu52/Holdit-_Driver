import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getDriverProfile, 
  updateDriverInfo, 
  updateDriverLocation, 
  updateDriverStatus, 
  getDriverStats, 
  DriverProfile 
} from "../api/endpoints/driver";
import Toast from "react-native-toast-message";

export const useDriverProfile = () => {
  return useQuery({
    queryKey: ["driverProfile"],
    queryFn: getDriverProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useDriverStats = () => {
  return useQuery({
    queryKey: ["driverStats"],
    queryFn: getDriverStats,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useUpdateDriverStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDriverStatus,
    onSuccess: (data, variables) => {
      // Optimistically update or refetch
      queryClient.setQueryData(["driverProfile"], (oldData: DriverProfile | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, is_online: variables };
      });
      Toast.show({
        type: "success",
        text1: "Status Updated",
        text2: `You are now ${variables ? "ONLINE" : "OFFLINE"}`,
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Failed to update status",
        text2: error?.message || "Please try again",
      });
    }
  });
};
export const useUpdateDriverLocation = () => {
  return useMutation({
    mutationFn: updateDriverLocation,
    onSuccess: () => {
      // Optional: Handle success if needed (usually silent for background updates)
    },
    onError: (error: any) => {
      console.error("Location update failed:", error);
    }
  });
};
