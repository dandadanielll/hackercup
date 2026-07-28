"use client";

import React, { useState } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../index.css";
import { Sidebar, Workspace } from "../components/Sidebar";
import LokalSwapPage from "./page";
import { LokalBankWorkspace } from "../components/bank/LokalBankWorkspace";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
});

export default function RootLayout() {
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>("lokalswap");

  return (
    <html lang="en">
      <head>
        <title>LokalSwap — Philippine Teacher Tools</title>
        <meta name="description" content="Mother Tongue & Regional Contextualizer + Community Vault for Philippine Teachers" />
      </head>
      <body
        className={`${jakarta.variable} font-sans antialiased bg-aralkada-main text-aralkada-border flex h-screen overflow-hidden selection:bg-aralkada-blue/20`}
      >
        <Sidebar
          activeWorkspace={activeWorkspace}
          onWorkspaceChange={setActiveWorkspace}
        />
        <div className="flex-1 overflow-y-auto">
          {activeWorkspace === "lokalswap" && <LokalSwapPage />}
          {activeWorkspace === "lokalbank" && <LokalBankWorkspace />}
          {activeWorkspace === "bayanquest" && (
            <div className="min-h-full px-8 py-10 max-w-[1200px] mx-auto flex items-center justify-center">
              <div className="text-center opacity-40">
                <p className="font-bold text-2xl mb-2">BayanQuest</p>
                <p className="text-aralkada-muted">Coming soon</p>
              </div>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
