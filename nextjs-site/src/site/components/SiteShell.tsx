import type { ReactNode } from "react";
import { SiteFooter } from "@/src/site/components/SiteFooter";
import { SiteHeader } from "@/src/site/components/SiteHeader";

type SiteShellProps = {
  activePath: string;
  children: ReactNode;
};

export function SiteShell({ activePath, children }: SiteShellProps) {
  return (
    <>
      <SiteHeader activePath={activePath} />
      {children}
      <SiteFooter />
    </>
  );
}
