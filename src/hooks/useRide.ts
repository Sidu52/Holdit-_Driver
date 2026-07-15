import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as RideApi from "../api/endpoints/ride";
import Toast from "react-native-toast-message";

export const usePendingOffers = () => {
  return useQuery({
    queryKey: ["pendingOffers"],
    queryFn: RideApi.getPendingOffer,
    // Poll every 5s so new offers are not missed if a socket event is dropped
    refetchInterval: 5000,
    retry: false,
  });
};

export const useActiveRide = () => {
  return useQuery({
    queryKey: ["activeRide"],
    queryFn: RideApi.getActiveRide,
    // Poll every 5s — primary fix for active ride not appearing after accept
    // Socket events call invalidateQueries but polling is the safety net
    refetchInterval: 5000,
    retry: false,
  });
};

export const useRideHistory = () => {
  return useQuery({
    queryKey: ["rideHistory"],
    queryFn: RideApi.getRideHistory,
  });
};

export const useAcceptRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: RideApi.acceptRide,
    onSuccess: (_data, bookingId) => {
      queryClient.setQueryData(["pendingOffers"], (oldData: any) =>
        Array.isArray(oldData) ? oldData.filter((offer: any) => offer._id !== bookingId) : []
      );
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      Toast.show({
        type: "success",
        text1: "Ride Accepted",
        text2: "Head to the pickup location.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Accept Failed",
        text2: error?.message || "Could not accept the ride.",
      });
    }
  });
};

export const useRejectRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: RideApi.rejectRide,
    onSuccess: (_data, bookingId) => {
      queryClient.setQueryData(["pendingOffers"], (oldData: any) =>
        Array.isArray(oldData) ? oldData.filter((offer: any) => offer._id !== bookingId) : []
      );
    }
  });
};

// You can add more mutations here for arrivePickup, completeDelivery, etc.
export const useArriveAtPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: RideApi.arriveAtPickup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      Toast.show({
        type: "success",
        text1: "Arrived at Pickup",
        text2: "You have arrived at the pickup location.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Could not update status.",
      });
    }
  });
};

export const useCompletePickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, otp, photos }: { bookingId: string; otp?: string; photos?: string[] }) => {
      const formData = new FormData();
      if (otp) {
        formData.append("otp", otp);
      }
      if (photos && photos.length > 0) {
        photos.forEach((photoUri, index) => {
          const filename = photoUri.split('/').pop() || `photo${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          
          formData.append("photos", {
            uri: photoUri,
            name: filename,
            type
          } as any);
        });
      }
      return RideApi.completePickup(bookingId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      Toast.show({
        type: "success",
        text1: "Pickup Completed",
        text2: "Heading to store/dropoff.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Could not complete pickup.",
      });
    }
  });
};

export const useArriveAtStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: RideApi.arriveAtStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      Toast.show({
        type: "success",
        text1: "Arrived at Store",
        text2: "You have arrived at the store.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Could not update status.",
      });
    }
  });
};

export const useArriveAtStoreForReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: RideApi.arriveAtStoreForReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      Toast.show({
        type: "success",
        text1: "Arrived at Store",
        text2: "You have arrived at store for return pickup.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Could not update status.",
      });
    }
  });
};

export const useArriveAtDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: RideApi.arriveAtDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      Toast.show({
        type: "success",
        text1: "Arrived for Delivery",
        text2: "You have arrived at the delivery location.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Could not update status.",
      });
    }
  });
};

export const useCompleteDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, otp, photos }: { bookingId: string; otp?: string; photos?: string[] }) => {
      const formData = new FormData();
      if (otp) {
        formData.append("otp", otp);
      }
      if (photos && photos.length > 0) {
        photos.forEach((photoUri, index) => {
          const filename = photoUri.split('/').pop() || `photo${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;
          
          formData.append("photos", {
            uri: photoUri,
            name: filename,
            type
          } as any);
        });
      }
      return RideApi.completeDelivery(bookingId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      queryClient.invalidateQueries({ queryKey: ["rideHistory"] });
      queryClient.invalidateQueries({ queryKey: ["driverStats"] });
      Toast.show({
        type: "success",
        text1: "Delivery Completed",
        text2: "Great job!",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Could not complete delivery.",
      });
    }
  });
};

export const useCancelRide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason?: string }) => 
      RideApi.cancelRide(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeRide"] });
      Toast.show({
        type: "info",
        text1: "Ride Cancelled",
        text2: "The ride has been cancelled.",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Cancellation Failed",
        text2: error?.message || "Could not cancel the ride.",
      });
    }
  });
};
