import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as RideApi from "../api/endpoints/ride";
import Toast from "react-native-toast-message";

export const usePendingOffers = () => {
  return useQuery({
    queryKey: ["pendingOffers"],
    queryFn: RideApi.getPendingOffer,
    refetchInterval: false,
    retry: false,
  });
};

export const useActiveRide = () => {
  return useQuery({
    queryKey: ["activeRide"],
    queryFn: RideApi.getActiveRide,
    refetchInterval: false,
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
