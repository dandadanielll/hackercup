import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "LokalSwap",
  description: "Mother Tongue & Regional Contextualizer for Philippine Teachers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
