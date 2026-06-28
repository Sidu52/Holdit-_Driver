import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<Location.LocationGeocodedAddress | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let subscriber: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startWatching = async () => {
      try {
        setIsLoading(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setErrorMsg('Permission to access location was denied');
          if (isMounted) setIsLoading(false);
          return;
        }

        const initialLoc = await Location.getCurrentPositionAsync({});
        if (isMounted) {
            setLocation(initialLoc);
            const reverse = await Location.reverseGeocodeAsync({ 
                latitude: initialLoc.coords.latitude, 
                longitude: initialLoc.coords.longitude 
            });
            if (reverse.length > 0) setAddress(reverse[0]);
        }

        // Realtime updates
        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 10,
          },
          (newLocation) => {
            if (isMounted) setLocation(newLocation);
          }
        );
      } catch (err) {
        if (isMounted) setErrorMsg('Failed to fetch location');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    startWatching();

    return () => {
      isMounted = false;
      if (subscriber) {
        subscriber.remove();
      }
    };
  }, []);

  return { location, address, errorMsg, isLoading };
};
