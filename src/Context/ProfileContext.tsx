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
  renameUsername,
  signIn,
  signOut,
  updateProfileFields,
  type CreateAccountInput,
  type LocalAccount,
} from "../lib/localAuth";

export type UserProfile = {
  username: string;
  displayName: string;
  phone: string;
  address: string;
};

type ProfileContextValue = {
  ready: boolean;
  loggedIn: boolean;
  isGuest: boolean;
  profile: UserProfile | null;
  continueAsGuest: () => void;
  createProfile: (
    input: CreateAccountInput
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logInWithPassword: (
    login: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  logOut: () => Promise<void>;
  setDisplayName: (displayName: string) => Promise<void>;
  updateProfile: (patch: {
    displayName?: string;
    phone?: string;
    address?: string;
    username?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  resetToGuest: () => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

function toProfile(account: LocalAccount): UserProfile {
  return {
    username: account.username,
    displayName: account.displayName || account.username,
    phone: account.phone || "",
    address: account.address || "",
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let alive = true;
    const boot = (async () => {
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
      } catch {
        if (alive) setProfile(null);
      } finally {
        if (alive) setReady(true);
      }
    })();

    // Fail open so splash never sticks if storage hangs.
    const failOpen = setTimeout(() => {
      if (alive) setReady(true);
    }, 2500);

    void boot.finally(() => clearTimeout(failOpen));
    return () => {
      alive = false;
      clearTimeout(failOpen);
    };
  }, []);

  const continueAsGuest = useCallback(() => {
    setProfile(null);
  }, []);

  const createProfile = useCallback(async (input: CreateAccountInput) => {
    const result = await createAccount(input);
    if (!result.ok) return result;
    setProfile(toProfile(result.account));
    return { ok: true as const };
  }, []);

  const logInWithPassword = useCallback(
    async (login: string, password: string) => {
      const result = await signIn(login, password);
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
      await updateProfileFields(profile.username, { displayName });
      setProfile({
        ...profile,
        displayName: displayName.trim() || profile.username,
      });
    },
    [profile]
  );

  const updateProfile = useCallback(
    async (patch: {
      displayName?: string;
      phone?: string;
      address?: string;
      username?: string;
    }) => {
      if (!profile) return { ok: false as const, error: "Not signed in." };
      let workingUser = profile.username;
      if (
        patch.username !== undefined &&
        patch.username.trim().toLowerCase() !== profile.username
      ) {
        const renamed = await renameUsername(profile.username, patch.username);
        if (!renamed.ok) return renamed;
        workingUser = renamed.account.username;
        setProfile(toProfile(renamed.account));
      }
      const fieldPatch: {
        displayName?: string;
        phone?: string;
        address?: string;
      } = {};
      if (patch.displayName !== undefined)
        fieldPatch.displayName = patch.displayName;
      if (patch.phone !== undefined) fieldPatch.phone = patch.phone;
      if (patch.address !== undefined) fieldPatch.address = patch.address;
      if (Object.keys(fieldPatch).length) {
        const result = await updateProfileFields(workingUser, fieldPatch);
        if (!result.ok) return result;
      }
      const account = await getAccount(workingUser);
      if (account) setProfile(toProfile(account));
      return { ok: true as const };
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
      updateProfile,
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
      updateProfile,
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
