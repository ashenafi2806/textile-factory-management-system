"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarWidth: number; // px
  contentOffset: number; // px (sidebar + gap)
  isDesktop: boolean;
};

const SidebarContext = createContext<SidebarContextValue | undefined>(
  undefined,
);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      // default collapsed on small screens
      setCollapsed(!desktop);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // widths chosen to make collapsed icons comfortable and expanded sidebar a bit wider
  const COLLAPSED_WIDTH = 96; // px
  const EXPANDED_WIDTH = 300; // px
  const sidebarWidth = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH; // px
  const contentOffset = sidebarWidth + 24; // space between sidebar and page content

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        sidebarWidth,
        contentOffset,
        isDesktop,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
