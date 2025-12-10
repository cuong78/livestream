import { useState, useEffect } from "react";
import { locationApi } from "@/services/api";
import type { UserLocation } from "@/types";

interface GeolocationState {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

export const useGeolocation = (autoRequest: boolean = true) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
    permissionDenied: false,
  });

  const requestLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Request permission and get position
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;

      // Save location to backend
      const savedLocation = await locationApi.saveLocation({
        latitude,
        longitude,
        userAgent: navigator.userAgent,
      });

      setState({
        location: savedLocation,
        loading: false,
        error: null,
        permissionDenied: false,
      });

      console.log("Location saved:", savedLocation);
    } catch (error: any) {
      console.error("Geolocation error:", error);

      let errorMessage = "Failed to get location";
      let permissionDenied = false;

      if (error.code === 1) {
        // PERMISSION_DENIED
        errorMessage = "Location permission denied";
        permissionDenied = true;
      } else if (error.code === 2) {
        // POSITION_UNAVAILABLE
        errorMessage = "Location unavailable";
      } else if (error.code === 3) {
        // TIMEOUT
        errorMessage = "Location request timeout";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setState({
        location: null,
        loading: false,
        error: errorMessage,
        permissionDenied,
      });
    }
  };

  useEffect(() => {
    if (autoRequest) {
      // Auto request location when component mounts
      requestLocation();
    }
  }, [autoRequest]);

  return {
    ...state,
    requestLocation,
  };
};
