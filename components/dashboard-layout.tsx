"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { hasValidAuthSession } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({
  children,
  title = "Dashboard",
}: DashboardLayoutProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!hasValidAuthSession()) {
      router.replace("/");
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 rounded-full border-4 border-slate-700 border-t-amber-400 animate-spin mx-auto"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="min-w-0 flex-1 md:ml-[209px]">
        <Header
          title={title}
          onMenuToggle={() => setIsSidebarOpen((open) => !open)}
        />
        <div className="pt-24 pb-8">{children}</div>
      </main>
    </div>
  );
}
