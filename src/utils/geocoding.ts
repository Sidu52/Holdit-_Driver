import * as Location from 'expo-location';

export const geocodingService = {
  // Get current raw location
  getCurrentLocation: async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission to access location was denied');
    }
    let location = await Location.getCurrentPositionAsync({});
    return location;
  },

  // Reverse geocode to address
  getAddressFromCoords: async (latitude: number, longitude: number) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        return addresses[0];
      }
      return null;
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return null;
    }
  }
};
