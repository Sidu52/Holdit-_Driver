import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useUpdateDriverLocation } from './useDriver';

export const useLocationTracking = (isOnline: boolean) => {
  const { mutate: updateLocation } = useUpdateDriverLocation();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const startTracking = async () => {
      // Check permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      // Initial update
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        updateLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
      } catch (error) {
        console.error('Initial location fetch failed:', error);
      }

      // Set interval for every 5 seconds
      intervalRef.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          updateLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        } catch (error) {
          console.error('Location update failed:', error);
        }
      }, 5000);
    };

    if (isOnline) {
      startTracking();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOnline, updateLocation]);
};
