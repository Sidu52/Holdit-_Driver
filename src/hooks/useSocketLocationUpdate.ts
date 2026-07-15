import { useEffect, useRef, useCallback } from "react";
import { useSocket } from "../sockets/SocketProvider";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

interface LocationPayload {
  bookingId?: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
}

interface UseSocketLocationUpdateOptions {
  enabled?: boolean;
  interval?: number; // milliseconds between updates, default 3000
  minAccuracy?: Location.Accuracy;
}

/**
 * Hook to emit driver location updates via Socket.IO in real-time
 * Used for active bookings to provide live tracking to admin dashboard
 *
 * @param isOnline - Whether driver is currently online
 * @param bookingId - Active booking ID (optional, if provided location updates are sent)
 * @param options - Configuration options
 *
 * @example
 * const { lastEmit } = useSocketLocationUpdate(isOnline, activeBookingId, {
 *   interval: 3000,
 *   enabled: true
 * });
 */
export const useSocketLocationUpdate = (
  isOnline: boolean,
  bookingId?: string,
  options: UseSocketLocationUpdateOptions = {},
) => {
  const { socket, isConnected } = useSocket();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEmitRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const MAX_CONSECUTIVE_ERRORS = 5;

  const {
    enabled = true,
    interval = 3000,
    minAccuracy = Location.Accuracy.Balanced,
  } = options;

  const emitLocation = useCallback(async () => {
    if (!socket?.connected || !isOnline || !bookingId || !enabled) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: minAccuracy,
      });

      if (!location || location.coords == null) {
        throw new Error("Location coordinates unavailable");
      }

      const payload: LocationPayload = {
        bookingId,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        heading: location.coords.heading ?? undefined,
        speed: location.coords.speed ?? undefined,
        timestamp: Date.now(),
      };

      // Validate coordinates before sending
      if (
        payload.lat < -90 ||
        payload.lat > 90 ||
        payload.lng < -180 ||
        payload.lng > 180
      ) {
        throw new Error("Invalid coordinates");
      }

      // Emit via socket (primary method for real-time)
      socket.emit("driver:location:update", payload);
      lastEmitRef.current = Date.now();
      errorCountRef.current = 0; // Reset error counter on success

      console.log("[LocationUpdate] Emitted:", {
        bookingId,
        lat: payload.lat,
        lng: payload.lng,
      });
    } catch (error) {
      errorCountRef.current++;
      console.error("[LocationUpdate] Failed to emit location:", error);

      // Show toast if too many consecutive errors
      if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
        Toast.show({
          type: "error",
          text1: "Location Update Failed",
          text2:
            "Unable to send location updates. Please check your connection.",
        });
        errorCountRef.current = 0; // Reset after showing toast
      }
    }
  }, [socket, isOnline, bookingId, enabled, minAccuracy]);

  // Setup interval for continuous location updates
  useEffect(() => {
    if (!isOnline || !bookingId || !isConnected || !enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial emit
    emitLocation();

    // Set interval for continuous updates
    intervalRef.current = setInterval(emitLocation, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, bookingId, isConnected, enabled, interval, emitLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    lastEmit: lastEmitRef.current,
    isEmitting: !!(isOnline && bookingId && isConnected && enabled),
    errorCount: errorCountRef.current,
  };
};
