import { ReactNode } from "react";

/** Uses parent `production/layout` for navbar and shell. */
export default function ProductionNewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
