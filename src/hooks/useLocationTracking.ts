import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { useUpdateDriverLocation } from './useDriver';
import { tokenService } from '../utils/tokenManager';
import axios from 'axios';
import { API_BASE_URL } from '../api/config';

const BACKGROUND_LOCATION_TASK = 'background-driver-location-task';

// Helper to get location with fallback
const getSafeLocation = async (accuracy: Location.Accuracy) => {
  try {
    const loc = await Location.getCurrentPositionAsync({
      accuracy,
    });
    if (loc && loc.coords) return loc;
  } catch (err) {
    console.warn('[LocationTracking] getCurrentPositionAsync failed, falling back to getLastKnownPositionAsync:', err);
  }

  try {
    const lastLoc = await Location.getLastKnownPositionAsync();
    if (lastLoc && lastLoc.coords) return lastLoc;
  } catch (err) {
    console.error('[LocationTracking] Both location fetch methods failed:', err);
  }
  return null;
};

// Define the background task for location tracking
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error('[BackgroundLocation] Task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    if (locations && locations.length > 0) {
      const location = locations[0];
      try {
        const token = await tokenService.getAccessToken();
        if (token && token !== 'null' && token !== 'undefined') {
          // Send background location update directly via Axios since hooks cannot run in background tasks
          await axios.put(
            `${API_BASE_URL}/driver/update-driver-location`,
            {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log('[BackgroundLocation] Auto-updated location successfully:', location.coords.latitude, location.coords.longitude);
        }
      } catch (err: any) {
        console.error('[BackgroundLocation] Failed to send location update:', err?.message || err);
      }
    }
  }
});

export const useLocationTracking = (isOnline: boolean) => {
  const { mutate: updateLocation } = useUpdateDriverLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTrackingBackgroundRef = useRef<boolean>(false);

  useEffect(() => {
    const startTracking = async () => {
      // 1. Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Permission to access location in foreground was denied');
        return;
      }

      // Initial foreground update
      const initialLoc = await getSafeLocation(Location.Accuracy.High);
      if (initialLoc) {
        updateLocation({
          lat: initialLoc.coords.latitude,
          lng: initialLoc.coords.longitude,
        });
      }

      // 2. Request background permissions & start background tracking if allowed
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
            foregroundService: {
              notificationTitle: 'Holdit Location Sync',
              notificationBody: 'Sending live location updates to system...',
              notificationColor: '#135BEC',
            },
          });
          isTrackingBackgroundRef.current = true;
          console.log('[LocationTracking] Background location tracking started successfully.');
          return; // Skip setting interval since background task handles updates
        }
      } catch (err) {
        console.warn('[LocationTracking] Could not initiate background updates:', err);
      }

      // 3. Fallback: Set interval for foreground updates only
      console.log('[LocationTracking] Falling back to foreground-only location updates.');
      intervalRef.current = setInterval(async () => {
        const location = await getSafeLocation(Location.Accuracy.Balanced);
        if (location) {
          updateLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      }, 5000);
    };

    const stopTracking = async () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (isTrackingBackgroundRef.current) {
        try {
          const hasStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          if (hasStarted) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
          }
        } catch (err) {
          console.error('[LocationTracking] Stop background tracking failed:', err);
        }
        isTrackingBackgroundRef.current = false;
      }
    };

    if (isOnline) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isOnline, updateLocation]);
};
