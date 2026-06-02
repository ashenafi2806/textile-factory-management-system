"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { useSidebar } from "@/context/sidebar-context";
import workforceService from "@/services/workforceService";
// Theme icons
const Sun = (props: any) => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <circle cx="12" cy="12" r="3" strokeWidth="2" />
    <path
      strokeWidth="2"
      d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
    />
  </svg>
);
const Moon = (props: any) => (
  <svg
    className="w-5 h-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path strokeWidth="2" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);
// Inline SVG icon components (kept small to avoid external deps)
const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <svg
    className="w-6 h-6"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    {children}
  </svg>
);
const Home = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M3 9.75L12 3l9 6.75V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.75z"
    />
  </IconWrapper>
);
const Box = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 16V8a2 2 0 0 0-1-1.732L12 3 4 6.268A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.732L12 21l8-3.268A2 2 0 0 0 21 16z"
    />
  </IconWrapper>
);
const Layers = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 18l9 5 9-5"
    />
  </IconWrapper>
);
const Users = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 21v-2a4 4 0 0 0-3-3.87M7 21v-2a4 4 0 0 1 3-3.87M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
    />
  </IconWrapper>
);
const FileText = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12h6M9 16h6M14 3v4a1 1 0 0 0 1 1h4"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"
    />
  </IconWrapper>
);
const Calendar = (props: any) => (
  <IconWrapper>
    <rect x="3" y="5" width="18" height="16" rx="2" ry="2" strokeWidth="2" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M16 3v4M8 3v4M3 11h18"
    />
  </IconWrapper>
);
const Menu = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </IconWrapper>
);
const ChevronLeft = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 19l-7-7 7-7"
    />
  </IconWrapper>
);
const LogOut = (props: any) => (
  <IconWrapper>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M17 16l4-4m0 0l-4-4m4 4H7"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M7 8v8"
    />
  </IconWrapper>
);

type LinkDef = { href: string; label: string; icon: any };

const sidebarLinksByRole: Record<string, LinkDef[]> = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/production", label: "Production", icon: Layers },
    { href: "/admin/workforce", label: "Workforce", icon: Users },
    { href: "/inventory", label: "Inventory", icon: Box },
    { href: "/manager/hiring-requests", label: "Hiring", icon: FileText },
  ],
  MANAGER: [
    { href: "/dashboard/manager", label: "Manager", icon: Home },
    {
      href: "/manager/leave-approvals",
      label: "Manager Console",
      icon: FileText,
    },
    { href: "/manager/analytics", label: "Analytics", icon: Layers },
    { href: "/manager/hiring-requests", label: "Hiring", icon: FileText },
    { href: "/production", label: "Production", icon: Layers },
    { href: "/inventory", label: "Inventory", icon: Box },
    { href: "/workforce/staffing", label: "Staffing", icon: Users },
    { href: "/workforce/workers", label: "Workers", icon: Users },
  ],
  SUPERVISOR: [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/admin/workforce", label: "Workforce", icon: Users },
    { href: "/supervisor/attendance", label: "Attendance", icon: Calendar },
    { href: "/supervisor/shifts", label: "Shifts", icon: Calendar },
    { href: "/manager/leave-approvals", label: "Leaves", icon: FileText },
    { href: "/supervisor/incidents", label: "Incidents", icon: FileText },
    { href: "/supervisor/discipline", label: "Discipline", icon: FileText },
  ],
  HR_ADMIN: [
    { href: "/admin/workforce", label: "Workforce", icon: Users },
    { href: "/manager/leave-approvals", label: "Leaves", icon: Calendar },
  ],
  STOREKEEPER: [
    { href: "/inventory", label: "Inventory", icon: Box },
    {
      href: "/dashboard/inventory/reorder-alerts",
      label: "Reorder Alerts",
      icon: FileText,
    },
    {
      href: "/dashboard/inventory/release-queue",
      label: "Release Queue",
      icon: FileText,
    },
    {
      href: "/dashboard/inventory/requisitions",
      label: "Requisitions",
      icon: FileText,
    },
  ],
  PRODUCTION_MANAGER: [
    { href: "/production", label: "Production", icon: Layers },
    { href: "/production-manager", label: "Manager Hub", icon: Layers },
  ],
  PRODUCTION_SUPERVISOR: [
    { href: "/production", label: "Production", icon: Layers },
    { href: "/production-supervisor", label: "Supervisor Hub", icon: Layers },
  ],
  QA_MANAGER: [
    { href: "/dashboard", label: "QA Dashboard", icon: Home },
    { href: "/production", label: "Production", icon: Layers },
    { href: "/dashboard/inventory/reorder-alerts", label: "Reorder Alerts", icon: FileText },
    { href: "/dashboard/notifications", label: "Notifications", icon: FileText },
  ],
  QA_STAFF: [
    { href: "/dashboard", label: "QA Dashboard", icon: Home },
    { href: "/production", label: "Production", icon: Layers },
    { href: "/production/qa", label: "QA Console", icon: Layers },
    { href: "/dashboard/notifications", label: "Notifications", icon: FileText },
  ],
  MAINTENANCE_MANAGER: [
    { href: "/maintenance", label: "Maintenance", icon: Layers },
    { href: "/maintenance/my-tasks", label: "My Tasks", icon: FileText },
  ],
  MAINTENANCE_TECHNICIAN: [
    { href: "/maintenance/my-tasks", label: "My Tasks", icon: FileText },
  ],
};

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { collapsed, setCollapsed, sidebarWidth, isDesktop } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // initialize theme from localStorage or system preference
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark" || stored === "light") {
        setTheme(stored);
        document.documentElement.classList.toggle("dark", stored === "dark");
      } else {
        const prefersDark = window.matchMedia?.(
          "(prefers-color-scheme: dark)",
        ).matches;
        setTheme(prefersDark ? "dark" : "light");
        document.documentElement.classList.toggle("dark", prefersDark);
      }
    } catch (e) {
      // ignore for SSR safety
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    workforceService
      .getMe()
      .then((r: any) => {
        if (!mounted) return;
        setProfilePic(r.data?.profilePictureUrl ?? null);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch (e) {}
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  // collapse state is now handled by SidebarProvider

  if (!user) return null;

  // gather links for user's roles
  const links: LinkDef[] = [];
  user.roles.forEach((r: string) => {
    const arr = sidebarLinksByRole[r];
    if (arr) arr.forEach((l) => links.push(l));
  });

  // dedupe by href
  let uniqLinks = links.reduce<LinkDef[]>((acc, cur) => {
    if (!acc.find((a) => a.href === cur.href)) acc.push(cur);
    return acc;
  }, []);

  // If user is ADMIN, allow everything: merge all role link sets
  if (user.roles.includes("ADMIN")) {
    const all = Object.values(sidebarLinksByRole).flat();
    uniqLinks = all.reduce<LinkDef[]>((acc, cur) => {
      if (!acc.find((a) => a.href === cur.href)) acc.push(cur);
      return acc;
    }, []);
  }

  const isDark = theme === "dark";

  const SidebarItem = ({ href, label, icon: Icon }: LinkDef) => {
    const active = pathname === href || pathname?.startsWith(href + "/");
    const base = active
      ? "text-white bg-indigo-600"
      : "text-slate-700 dark:text-slate-200 hover:bg-slate-700/10";
    const collapsedClasses = "justify-center px-2 py-3";
    const expandedClasses = "items-center gap-3 px-3 py-2";
    return (
      <Link
        href={href}
        className={`flex ${collapsed ? collapsedClasses : expandedClasses} rounded-md transition-colors text-sm ${base}`}
        aria-current={active ? "page" : undefined}
      >
        <Icon className="w-6 h-6" />
        {!collapsed && <span className="font-semibold">{label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile top bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 bg-white text-slate-900 border-b dark:bg-slate-900 dark:text-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-md bg-slate-800/60"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-black tracking-tight">TFMS</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-bold dark:text-slate-200">
              {user.username}
            </div>
            <div className="text-xs text-slate-300 dark:text-slate-400">
              {user.roles[0]}
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800/60"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-slate-900" />
            ) : (
              <Moon className="w-5 h-5 text-slate-900" />
            )}
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800/60"
          >
            <LogOut className="w-5 h-5 text-slate-700 dark:text-slate-200" />
          </button>
        </div>
      </div>

      {/* Desktop top navbar (visible on md+) */}
      <div
        style={
          isDesktop
            ? { left: sidebarWidth, width: `calc(100% - ${sidebarWidth}px)` }
            : undefined
        }
        className="hidden md:flex fixed top-0 h-16 items-center px-4 z-40 bg-white text-slate-900 border-b dark:bg-slate-900 dark:text-slate-200"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`p-2 rounded-md ${isDark ? "bg-slate-800/50" : "bg-slate-100"}`}
            aria-label="Toggle sidebar"
          >
            <Menu />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-black tracking-tight">TFMS</span>
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md bg-slate-100 dark:bg-slate-800/50"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun /> : <Moon />}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="flex items-center gap-2 p-1 rounded-full"
              title="Account"
            >
              {profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePic}
                  alt="avatar"
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                  {user.username?.slice(0, 2).toUpperCase()}
                </div>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg border dark:bg-slate-800">
                <button
                  onClick={() => {
                    // navigate to profile page
                    setMenuOpen(false);
                    window.location.href = "/employee/profile";
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Profile
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-rose-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col md:z-50">
        <div
          style={{ width: sidebarWidth }}
          className="flex flex-col h-full transition-all duration-300 shadow-lg bg-white text-slate-900 border-r dark:bg-slate-900 dark:text-slate-200"
        >
          <div className="flex items-center justify-between px-4 py-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Home className="w-6 h-6" />
              </div>
              {!collapsed && <span className="font-black text-lg">TFMS</span>}
            </Link>
            <div className="flex items-center gap-2">
              {/* collapse handled by topbar toggle; nothing here */}
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {uniqLinks.map((l) => (
              <div key={l.href} className="px-2">
                <SidebarItem {...l} />
              </div>
            ))}
          </nav>

          <div className="mt-auto px-4 py-4">
            <div
              className={`flex items-center gap-3 rounded-md px-2 py-2 pr-4 ${isDark ? "bg-slate-800/20" : "bg-slate-50"}`}
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                {user.username?.slice(0, 2).toUpperCase()}
              </div>
              {!collapsed && (
                <div className="flex-1">
                  <div className="font-bold">{user.username}</div>
                  <div className="text-xs text-slate-300">{user.roles[0]}</div>
                </div>
              )}
              <button
                onClick={logout}
                className={`p-2 rounded-md ${isDark ? "bg-slate-800/40" : "bg-slate-100"}`}
                aria-label="Logout"
              >
                <LogOut className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 text-slate-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
                  <Home className="w-5 h-5" />
                </div>
                <span className="font-black">TFMS</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-2">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
            <nav className="space-y-2">
              {uniqLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-slate-700/40 ${
                    pathname === l.href
                      ? "bg-indigo-600 text-white"
                      : "text-slate-200"
                  }`}
                >
                  <l.icon className="w-5 h-5" />
                  <span className="font-semibold">{l.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
