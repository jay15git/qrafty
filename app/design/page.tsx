import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Workspace } from "@/features/shell/components/Workspace";
import { THEME_COOKIE, parseTheme } from "@/features/shell/model/theme";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Design QR",
  description: "A desktop QR workspace with the full canvas and floating toolbar.",
};

export default async function DesktopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [cookieStore, params] = await Promise.all([cookies(), searchParams]);
  const initialTheme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <main
      data-slot="design-page"
      className={cn(
        "font-sans",
        "h-dvh min-h-0 overflow-hidden",
        initialTheme === "light" ? "bg-[#f0f1f2] text-neutral-950" : "bg-black text-white",
      )}
    >
      <Workspace
        initialTheme={initialTheme}
        initialActiveTool={
          params.source === "prompt" || params.source === "blank" ? "content" : undefined
        }
      />
    </main>
  );
}
