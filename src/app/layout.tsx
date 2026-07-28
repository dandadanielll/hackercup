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
      <body className={`${jakarta.variable} font-sans antialiased bg-aralkada-sidebar text-aralkada-border flex flex-col md:flex-row h-[100dvh] overflow-hidden selection:bg-aralkada-blue/20`}>
        <Sidebar />
        <main className="flex-1 flex flex-col h-full pt-2 px-2 pb-0 md:pt-4 md:pb-4 md:pr-4 md:pl-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-aralkada-main rounded-t-[2rem] md:rounded-[2.5rem] md:border-2 border-aralkada-border shadow-xl">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
