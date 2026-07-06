"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Book,
  BookOpen,
  CalendarDays,
  Database,
  Grid3X3,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
} from "lucide-react";

interface HeaderProps {
  title?: string;
  onMenuToggle: () => void;
}

const quickLinks = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Events", href: "/dashboard/events", icon: CalendarDays },
  { label: "Blogs", href: "/dashboard/blogs", icon: Book },
  { label: "Quiz", href: "/dashboard/quiz", icon: HelpCircle },
  { label: "Books", href: "/dashboard/books", icon: BookOpen },
  { label: "Verse", href: "/dashboard/verse", icon: BookOpen },
  { label: "Users", href: "/dashboard/users", icon: User },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Moderation", href: "/dashboard/moderation", icon: Settings },
  { label: "Logs & Audits", href: "/dashboard/logs", icon: HelpCircle },
  {
    label: "System Configuration",
    href: "/dashboard/system-config",
    icon: Settings,
  },
  { label: "Documentation", href: "/dashboard/documentation", icon: Book },
];

export function Header({ title = "Dashboard", onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDark, setIsDark] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return quickLinks.slice(0, 6);

    return quickLinks.filter((item) =>
      [item.label, item.href].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [searchQuery]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("dashboardTheme");
    const nextIsDark = savedTheme ? savedTheme !== "light" : true;
    setIsDark(nextIsDark);
    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextIsDark);
  }, []);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const updateDate = () => setCurrentDate(formatter.format(new Date()));

    updateDate();
    const interval = window.setInterval(updateDate, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setQuickMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const navigateTo = (href: string) => {
    router.push(href);
    setQuickMenuOpen(false);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const firstResult = searchResults[0];
    if (firstResult) navigateTo(firstResult.href);
  };

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    localStorage.setItem("dashboardTheme", nextIsDark ? "dark" : "light");
    document.documentElement.dataset.theme = nextIsDark ? "dark" : "light";
    document.documentElement.classList.toggle("dark", nextIsDark);
  };

  return (
    <header className="fixed right-0 top-0 left-0 md:left-[209px] border-b border-slate-800 bg-slate-950 z-40">
      <div className="flex items-center justify-between px-4 py-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuToggle}
            className="text-slate-400 hover:text-white transition-colors md:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-white font-['Source_Serif_4',serif]">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <form
              onSubmit={handleSearch}
              className="flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-3"
            >
              <Search className="h-4 w-4 text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setQuickMenuOpen(false)}
                placeholder="Search..."
                className="w-40 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </form>
            {searchQuery.trim() && (
              <SearchPanel
                results={searchResults}
                emptyLabel="No pages found"
                onSelect={navigateTo}
              />
            )}
          </div>

          {/* Mobile Search */}
          {searchOpen && (
            <form onSubmit={handleSearch} className="relative md:hidden">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-36 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                autoFocus
              />
              {searchQuery.trim() && (
                <SearchPanel
                  results={searchResults}
                  emptyLabel="No pages found"
                  onSelect={navigateTo}
                />
              )}
            </form>
          )}

          {/* Icons */}
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-900 hover:text-white md:hidden"
            aria-label="Open search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* <button
            type="button"
            onClick={() => navigateTo("/dashboard/notifications")}
            className="relative text-slate-400 hover:text-white transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500"></span>
          </button> */}

          <button
            type="button"
            onClick={() => navigateTo("/dashboard/system-config")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
            aria-label="Open system configuration"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setQuickMenuOpen((open) => !open);
                setSearchQuery("");
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
              aria-label="Open quick navigation"
              aria-expanded={quickMenuOpen}
            >
              <Grid3X3 className="h-5 w-5" />
            </button>
            {quickMenuOpen && (
              <div className="absolute right-0 top-9 w-72 rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-black/40">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Quick navigation
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.slice(0, 10).map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigateTo(item.href)}
                        className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
                      >
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-900 hover:text-white"
            aria-label={
              isDark ? "Switch to light theme" : "Switch to dark theme"
            }
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>

          {/* Date */}
          <div className="hidden h-10 items-center text-right lg:flex">
            <p className="whitespace-nowrap text-sm font-medium text-slate-400">
              {currentDate}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchPanel({
  results,
  emptyLabel,
  onSelect,
}: {
  results: typeof quickLinks;
  emptyLabel: string;
  onSelect: (href: string) => void;
}) {
  return (
    <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl shadow-black/40">
      {results.length ? (
        results.slice(0, 7).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(item.href)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
            >
              <Icon className="h-4 w-4 text-slate-500" />
              <span>{item.label}</span>
            </button>
          );
        })
      ) : (
        <p className="px-3 py-4 text-center text-sm text-slate-500">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}
