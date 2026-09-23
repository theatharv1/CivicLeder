import React, { createContext, useContext, useMemo, useState } from "react";
import type { AppLocation } from "../data/issues";

type LocationContextValue = {
  location: AppLocation;
  setLocation: (value: AppLocation) => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<AppLocation>("Delhi");
  const value = useMemo(() => ({ location, setLocation }), [location]);
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
