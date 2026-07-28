import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../index.css";
import { Sidebar } from "../components/Sidebar";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta'
});

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
      <body className={`${jakarta.variable} font-sans antialiased bg-aralkada-main text-aralkada-border flex h-screen overflow-hidden selection:bg-aralkada-blue/20`}>
        <Sidebar />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
