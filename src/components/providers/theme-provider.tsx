"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Thin wrapper around next-themes so it can be imported as a client
 * component from the (server) root layout. attribute="class" toggles the
 * `.dark` class that globals.css's @custom-variant reads.
 *
 * `disableTransitionOnChange` deliberately omitted (it defaults to false):
 * that flag exists specifically to suppress CSS transitions during the
 * class swap, which is the opposite of what we want — see globals.css's
 * "seamless theme transition" rule for the other half of this.
 */
export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  );
}
