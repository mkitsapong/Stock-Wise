"use client";

import ThemeProvider from "./ThemeProvider";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden pb-20 md:pb-0 flex flex-col">
          <TopBar />
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </ThemeProvider>
  );
}
