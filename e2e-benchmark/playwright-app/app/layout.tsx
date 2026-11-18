import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vacaturebank (fictief)",
  description: "Mini-vacaturesite voor de Jest/Vitest-benchmark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
