"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/context/auth-context";
import workforceService from "@/services/workforceService";

type ProfilePictureContextValue = {
  profilePictureUrl: string | null;
  refreshProfilePicture: () => Promise<string | null>;
  setProfilePictureUrl: (url: string | null) => void;
};

const ProfilePictureContext = createContext<
  ProfilePictureContextValue | undefined
>(undefined);

function withCacheBust(url: string | null | undefined): string | null {
  if (!url) return null;
  const base = url.split("?")[0];
  return `${base}?t=${Date.now()}`;
}

export function ProfilePictureProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );

  const refreshProfilePicture = useCallback(async () => {
    if (!user) {
      setProfilePictureUrl(null);
      return null;
    }
    try {
      const res = await workforceService.getMe();
      const next = withCacheBust(res.data?.profilePictureUrl);
      setProfilePictureUrl(next);
      return next;
    } catch {
      setProfilePictureUrl(null);
      return null;
    }
  }, [user]);

  useEffect(() => {
    refreshProfilePicture();
  }, [refreshProfilePicture]);

  return (
    <ProfilePictureContext.Provider
      value={{
        profilePictureUrl,
        refreshProfilePicture,
        setProfilePictureUrl,
      }}
    >
      {children}
    </ProfilePictureContext.Provider>
  );
}

export function useProfilePicture() {
  const ctx = useContext(ProfilePictureContext);
  if (!ctx) {
    throw new Error(
      "useProfilePicture must be used within ProfilePictureProvider",
    );
  }
  return ctx;
}
