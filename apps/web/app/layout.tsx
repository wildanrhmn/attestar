import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attestar — Continuous, provable solvency on Stellar",
  description:
    "Zero-knowledge proof-of-reserves-and-liabilities for stablecoin and RWA issuers on Stellar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
