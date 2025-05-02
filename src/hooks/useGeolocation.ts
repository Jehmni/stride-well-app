import { useState, useEffect, useCallback } from 'react';

type GeolocationState = {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  accuracy: number | null;
  timestamp: number | null;
  address: string | null;
};

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    accuracy: null,
    timestamp: null,
    address: null
  });

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
          ...options
        });
      });

      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        error: null,
        loading: false,
        address: null
      });

      // Attempt to get address using reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': navigator.language || 'en' } }
        );
        
        if (response.ok) {
          const data = await response.json();
          setState(prev => ({
            ...prev,
            address: data.display_name || null
          }));
        }
      } catch (error) {
        console.error('Error getting address:', error);
        // Don't update state with error, just keep the coordinates
      }
    } catch (error: any) {
      setState({
        latitude: null,
        longitude: null,
        accuracy: null,
        timestamp: null,
        error: error.message,
        loading: false,
        address: null
      });
    }
  }, [options]);

  // Function to watch position continuously
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return () => {};
    }

    setState(prev => ({ ...prev, loading: true }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          error: null,
          loading: false,
          address: null
        });
      },
      (error) => {
        setState({
          latitude: null,
          longitude: null,
          accuracy: null,
          timestamp: null,
          error: error.message,
          loading: false,
          address: null
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
        ...options
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  // Function to calculate distance between two coordinates
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(1));
  };

  // Helper function to convert degrees to radians
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  // Get location on mount
  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    ...state,
    getLocation,
    watchPosition,
    calculateDistance,
  };
};
