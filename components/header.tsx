"use client";

import { useState } from "react";
import { Menu, Search, Bell, Settings, Grid3X3, Moon, Sun } from "lucide-react";

interface HeaderProps {
  title?: string;
  onMenuToggle: () => void;
}

export function Header({ title = "Dashboard", onMenuToggle }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed right-0 top-0 left-0 md:left-[209px] border-b border-slate-800 bg-slate-950 z-40">
      <div className="flex items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="text-slate-400 hover:text-white transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-32"
            />
          </div>

          {/* Mobile Search */}
          {searchOpen && (
            <div className="md:hidden">
              <input
                type="text"
                placeholder="Search..."
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                autoFocus
              />
            </div>
          )}

          {/* Icons */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden text-slate-400 hover:text-white transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          <button className="relative text-slate-400 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <button className="text-slate-400 hover:text-white transition-colors">
            <Settings className="h-5 w-5" />
          </button>

          <button className="text-slate-400 hover:text-white transition-colors">
            <Grid3X3 className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsDark(!isDark)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Date */}
          <div className="hidden lg:block text-right">
            <p className="text-xs text-slate-400">Friday, June 5, 2026</p>
          </div>
        </div>
      </div>
    </header>
  );
}
