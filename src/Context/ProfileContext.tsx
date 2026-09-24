import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createAccount,
  getAccount,
  getSession,
  signIn,
  signOut,
  updateDisplayName,
  type LocalAccount,
} from "../lib/localAuth";

export type UserProfile = {
  username: string;
  displayName: string;
};

type ProfileContextValue = {
  ready: boolean;
  /** True only when signed in with username + password. Guests are not logged in. */
  loggedIn: boolean;
  isGuest: boolean;
  profile: UserProfile | null;
  continueAsGuest: () => void;
  createProfile: (
    username: string,
    password: string,
    displayName?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logInWithPassword: (
    username: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logOut: () => Promise<void>;
  setDisplayName: (displayName: string) => Promise<void>;
  /** After wipe: clear session UI without writing storage again. */
  resetToGuest: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function toProfile(account: LocalAccount): UserProfile {
  return {
    username: account.username,
    displayName: account.displayName || account.username,
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const session = await getSession();
        if (!alive) return;
        if (session?.username) {
          const account = await getAccount(session.username);
          if (!alive) return;
          if (account) {
            setProfile(toProfile(account));
          } else {
            await signOut();
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    setProfile(null);
  }, []);

  const createProfile = useCallback(
    async (username: string, password: string, displayName?: string) => {
      const result = await createAccount(username, password, displayName);
      if (!result.ok) return result;
      setProfile(toProfile(result.account));
      return { ok: true as const };
    },
    []
  );

  const logInWithPassword = useCallback(
    async (username: string, password: string) => {
      const result = await signIn(username, password);
      if (!result.ok) return result;
      setProfile(toProfile(result.account));
      return { ok: true as const };
    },
    []
  );

  const logOut = useCallback(async () => {
    await signOut();
    setProfile(null);
  }, []);

  const setDisplayName = useCallback(
    async (displayName: string) => {
      if (!profile) return;
      await updateDisplayName(profile.username, displayName);
      setProfile({
        username: profile.username,
        displayName: displayName.trim() || profile.username,
      });
    },
    [profile]
  );

  const resetToGuest = useCallback(() => {
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      loggedIn: Boolean(profile),
      isGuest: !profile,
      profile,
      continueAsGuest,
      createProfile,
      logInWithPassword,
      logOut,
      setDisplayName,
      resetToGuest,
    }),
    [
      ready,
      profile,
      continueAsGuest,
      createProfile,
      logInWithPassword,
      logOut,
      setDisplayName,
      resetToGuest,
    ]
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
