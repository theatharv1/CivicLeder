import React, { createContext, useContext, useMemo, useState } from "react";

export type UserProfile = {
  name: string;
  email: string;
  location: string;
};

type ProfileContextValue = {
  profile: UserProfile;
  setProfile: (next: UserProfile) => void;
  loggedIn: boolean;
  logOut: () => void;
  logIn: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Ananya Sharma",
    email: "ananya.sharma@email.com",
    location: "Delhi",
  });

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      loggedIn,
      logOut: () => setLoggedIn(false),
      logIn: () => setLoggedIn(true),
    }),
    [profile, loggedIn]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
