import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/unauthorized"];

const ROUTE_ROLE_MAP: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/admin", roles: ["ADMIN", "HR_ADMIN"] },
  { prefix: "/hr-admin", roles: ["HR_ADMIN", "ADMIN"] },
  { prefix: "/manager", roles: ["MANAGER", "ADMIN"] },
  { prefix: "/supervisor", roles: ["SUPERVISOR", "ADMIN"] },
  {
    prefix: "/inventory",
    roles: [
      "STOREKEEPER",
      "MANAGER",
      "PRODUCTION_MANAGER",
      "MAINTENANCE_MANAGER",
      "ADMIN",
    ],
  },
  {
    prefix: "/maintenance",
    roles: ["MAINTENANCE_MANAGER", "MAINTENANCE_TECHNICIAN", "ADMIN"],
  },
  {
    prefix: "/production",
    roles: [
      "PRODUCTION_MANAGER",
      "PRODUCTION_SUPERVISOR",
      "QA_MANAGER",
      "QA_STAFF",
      "ADMIN",
    ],
  },
  { prefix: "/dashboard/notifications", roles: ["ADMIN", "STOREKEEPER"] },
];

async function fetchCurrentUser(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";
  const token = request.cookies.get("access_token")?.value;
  if (!token && !cookieHeader) return null;

  try {
    const res = await fetch(new URL("/api/auth/me", request.url), {
      headers: {
        cookie: cookieHeader,
        authorization: token ? `Bearer ${token}` : "",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isAllowed(pathname: string, roles: string[]) {
  const matched = ROUTE_ROLE_MAP.find((entry) =>
    pathname.startsWith(entry.prefix),
  );
  if (!matched) return true;
  if (roles.includes("ADMIN")) return true;
  return matched.roles.some((role) => roles.includes(role));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublicPath) {
    const user = await fetchCurrentUser(request);
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (!isAllowed(pathname, user.roles ?? [])) {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
