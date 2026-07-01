"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api";
import { clearAuthSession, getAuthSession } from "@/lib/auth";
import {
  LayoutDashboard,
  BarChart3,
  Shield,
  Bell,
  Database,
  Settings,
  Book,
  BookOpen,
  CalendarDays,
  LogOut,
  User,
  Keyboard,
  HelpCircle,
  ChevronDown,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const session = getAuthSession();
  const user = session?.user;

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      clearAuthSession();
    } finally {
      router.replace("/");
    }
  };

  const menuItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { label: "Events", icon: CalendarDays, href: "/dashboard/events" },
    { label: "Blogs", icon: Book, href: "/dashboard/blogs" },
    { label: "Quiz", icon: HelpCircle, href: "/dashboard/quiz" },
    { label: "Books", icon: BookOpen, href: "/dashboard/books" },
    { label: "Roles", icon: Shield, href: "/dashboard/roles" },
    { label: "Notifications", icon: Bell, href: "/dashboard/notifications" },
    { label: "Database", icon: Database, href: "/dashboard/database" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
    { label: "Documentation", icon: Book, href: "/dashboard/documentation" },
  ];

  const accountItems = [
    { label: "Profile", icon: User, href: "/dashboard/profile" },
    {
      label: "Notifications",
      icon: Bell,
      href: "/dashboard/account-notifications",
    },
    { label: "Settings", icon: Settings, href: "/dashboard/account-settings" },
    {
      label: "Keyboard Shortcuts",
      icon: Keyboard,
      href: "/dashboard/shortcuts",
    },
    { label: "Help & Support", icon: HelpCircle, href: "/dashboard/help" },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 h-full w-[209px] transform border-r border-slate-800 bg-slate-950 pt-6 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="relative px-4 mb-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors md:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br to-blue-500">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">Bibleplus</div>
              <div className="text-xs text-slate-500">Admin Dashboard</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 no-scrollbar overflow-y-auto px-2">
          <div className="mb-6">
            <p className="px-3 text-xs font-semibold uppercase text-slate-500 mb-3">
              Overview
            </p>
            {menuItems.slice(0, 1).map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          <div className="mb-6">
            <p className="px-3 text-xs font-semibold uppercase text-slate-500 mb-3">
              Management
            </p>
            {menuItems.slice(1, 7).map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          <div className="mb-6">
            <p className="px-3 text-xs font-semibold uppercase text-slate-500 mb-3">
              System
            </p>
            {menuItems.slice(7, 11).map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>
        </nav>

        {/* Account Section */}
        <div className="border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={() => setIsAccountOpen((open) => !open)}
            className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <span>Account</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isAccountOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isAccountOpen && (
            <div className="mt-3 space-y-1">
              {accountItems.map((item) => (
                <SidebarLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  className="text-xs"
                />
              ))}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-900 p-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs font-bold text-white">
              DU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.username || "Admin"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.role || "admin"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface SidebarLinkProps {
  item: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
  };
  isActive: boolean;
  className?: string;
}

function SidebarLink({ item, isActive, className = "" }: SidebarLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-300"
      } ${className}`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}
