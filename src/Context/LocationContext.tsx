import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Location from "expo-location";
import type { AppLocation } from "../data/issues";
import { captureGps, isInIndia, shortPlaceLabel } from "../lib/captureGps";

type GpsState = {
  latitude: number;
  longitude: number;
  addressText: string | null;
  accuracyMeters: number | null;
};

type LocationContextValue = {
  location: AppLocation;
  setLocation: (value: AppLocation) => void;
  /** Short label for headers: real GPS place when available, else city picker. */
  locationLabel: string;
  /** True after first permission / GPS attempt. */
  locationReady: boolean;
  /** Real GPS inside India, if available. */
  gps: GpsState | null;
  refreshGps: () => Promise<void>;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function cityFromGeocode(
  p: Location.LocationGeocodedAddress
): AppLocation | null {
  const blob = `${p.city ?? ""} ${p.region ?? ""} ${p.subregion ?? ""} ${p.district ?? ""}`.toLowerCase();
  if (blob.includes("new delhi")) return "New Delhi";
  if (blob.includes("north") && blob.includes("delhi")) return "North Delhi";
  if (blob.includes("south") && blob.includes("delhi")) return "South Delhi";
  if (blob.includes("east") && blob.includes("delhi")) return "East Delhi";
  if (blob.includes("west") && blob.includes("delhi")) return "West Delhi";
  if (blob.includes("delhi")) return "Delhi";
  return null;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<AppLocation>("Delhi");
  const [locationReady, setLocationReady] = useState(false);
  const [gps, setGps] = useState<GpsState | null>(null);

  // Stable identity: screens call this from focus effects, and a new function
  // every render made them re-run endlessly (GPS + network request loop).
  const refreshGps = useCallback(async () => {
    const captured = await captureGps({ accuracy: "high" });
    if (!captured) {
      setGps(null);
      setLocationReady(true);
      return;
    }
    setGps({
      latitude: captured.latitude,
      longitude: captured.longitude,
      addressText: captured.addressText,
      accuracyMeters: captured.accuracyMeters,
    });
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: captured.latitude,
        longitude: captured.longitude,
      });
      const p = places[0];
      if (p && isInIndia(captured.latitude, captured.longitude)) {
        const city = cityFromGeocode(p);
        if (city) setLocation(city);
      }
    } catch {
      // keep selected city
    }
    setLocationReady(true);
  }, []);

  useEffect(() => {
    void refreshGps();
    const timer = setInterval(() => {
      void refreshGps();
    }, 90_000);
    return () => clearInterval(timer);
  }, []);

  const locationLabel = useMemo(() => {
    if (gps?.addressText) {
      return shortPlaceLabel(gps.addressText) || location;
    }
    return location;
  }, [gps?.addressText, location]);

  const value = useMemo(
    () => ({
      location,
      setLocation,
      locationLabel,
      locationReady,
      gps,
      refreshGps,
    }),
    [location, locationLabel, locationReady, gps, refreshGps]
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useAppLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useAppLocation must be used within LocationProvider");
  }
  return ctx;
}
