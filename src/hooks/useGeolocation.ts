// src/hooks/useGeolocation.ts
import { useEffect, useRef, useState } from "react";

export type Position = { lat: number; lng: number; accuracy?: number; timestamp: number };

export function useGeolocation(enable = true) {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enable) return;
    if (!("geolocation" in navigator)) {
      setError({ code: 0, message: "Geolocation not supported", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as any);
      return;
    }

    const success = (pos: GeolocationPosition) => {
      const coords = pos.coords;
      setPosition({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy, timestamp: pos.timestamp });
    };

    const err = (e: GeolocationPositionError) => {
      setError(e);
    };

    // watchPosition gives realtime updates
    watchIdRef.current = navigator.geolocation.watchPosition(success, err, {
      enableHighAccuracy: true,
      maximumAge: 1000,      // do not use very old cached positions
      timeout: 10000,
    });

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [enable]);

  const stop = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return { position, error, stop };
}
