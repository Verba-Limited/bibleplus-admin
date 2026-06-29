"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  analyticsApi,
  eventsApi,
  type AnalyticsActivityDay,
  type AnalyticsOverview,
  type AnalyticsTrending,
  type BibleplusEvent,
  type SystemHealth,
} from "@/lib/api";
import {
  Activity,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Heart,
  Loader2,
  Radio,
  RefreshCw,
  Server,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type OverviewState = {
  metrics: AnalyticsOverview | null;
  activity: AnalyticsActivityDay[];
  trending: AnalyticsTrending | null;
  system: SystemHealth | null;
  upcomingEvents: BibleplusEvent[];
};

const emptyOverview: OverviewState = {
  metrics: null,
  activity: [],
  trending: null,
  system: null,
  upcomingEvents: [],
};

const formatter = new Intl.NumberFormat("en");

function fulfilledData<T>(result: PromiseSettledResult<{ data?: T }>) {
  return result.status === "fulfilled" ? result.value.data : undefined;
}

function formatNumber(value?: number) {
  return formatter.format(value || 0);
}

function formatDate(value?: string) {
  if (!value) return "No date set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function stripHtml(value?: string) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toEventList(value: unknown): BibleplusEvent[] {
  if (Array.isArray(value)) return value as BibleplusEvent[];
  if (value && typeof value === "object") {
    const data = value as { events?: BibleplusEvent[]; results?: BibleplusEvent[] };
    return data.events || data.results || [];
  }
  return [];
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<OverviewState>(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = async () => {
    setIsLoading(true);
    setError("");

    const [metrics, activity, trending, system, upcomingEvents] =
      await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getActivity(),
        analyticsApi.getTrending(),
        analyticsApi.getSystemHealth(),
        eventsApi.getUpcoming(),
      ]);

    setOverview({
      metrics: fulfilledData(metrics) || null,
      activity: fulfilledData(activity) || [],
      trending: fulfilledData(trending) || null,
      system: fulfilledData(system) || null,
      upcomingEvents: toEventList(fulfilledData(upcomingEvents)),
    });

    const failedCount = [metrics, activity, trending, system, upcomingEvents].filter(
      (result) => result.status === "rejected"
    ).length;

    if (failedCount) {
      setError(`${failedCount} dashboard request${failedCount > 1 ? "s" : ""} failed. Showing what loaded.`);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const activityTotals = useMemo(
    () =>
      overview.activity.reduce(
        (totals, day) => ({
          users: totals.users + (day.users || 0),
          blogs: totals.blogs + (day.blogs || 0),
          prayers: totals.prayers + (day.prayers || 0),
          events: totals.events + (day.events || 0),
        }),
        { users: 0, blogs: 0, prayers: 0, events: 0 }
      ),
    [overview.activity]
  );

  const trendingBlogs = overview.trending?.trendingBlogs || [];
  const mongoConnected = overview.system?.mongoStatus === "connected";

  return (
    <DashboardLayout title="Dashboard">
      <div className="px-4 md:px-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">Overview</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Today at a glance</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              The quickest read on BiblePlus health, content, activity, and what needs your attention.
            </p>
          </div>
          <button
            type="button"
            onClick={loadOverview}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={Users} label="Users" value={formatNumber(overview.metrics?.totalUsers)} />
          <MetricCard icon={BookOpen} label="Blogs" value={formatNumber(overview.metrics?.totalBlogs)} />
          <MetricCard icon={CalendarDays} label="Events" value={formatNumber(overview.metrics?.totalEvents)} />
          <MetricCard icon={Heart} label="Prayers" value={formatNumber(overview.metrics?.totalPrayers)} />
          <MetricCard icon={Bell} label="Notifications" value={formatNumber(overview.metrics?.totalNotifications)} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
          <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Recent activity</h3>
                <p className="text-sm text-slate-400">A compact preview of the activity endpoint.</p>
              </div>
              <Link
                href="/dashboard/analytics"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200"
              >
                View analytics
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <SmallStat label="Users" value={activityTotals.users} />
              <SmallStat label="Blogs" value={activityTotals.blogs} />
              <SmallStat label="Prayers" value={activityTotals.prayers} />
              <SmallStat label="Events" value={activityTotals.events} />
            </div>

            <div className="h-[260px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={overview.activity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }} />
                  <Area type="monotone" dataKey="users" stroke="#60a5fa" fill="#60a5fa22" strokeWidth={2} />
                  <Area type="monotone" dataKey="events" stroke="#fbbf24" fill="#fbbf2422" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-white">Attention</h3>
            <p className="mt-1 text-sm text-slate-400">Fast operational signals.</p>

            <div className="mt-5 space-y-3">
              <AttentionItem
                icon={Server}
                title="System health"
                value={mongoConnected ? "MongoDB connected" : "MongoDB unknown"}
                tone={mongoConnected ? "good" : "warn"}
              />
              <AttentionItem
                icon={CalendarDays}
                title="Upcoming events"
                value={`${overview.upcomingEvents.length} loaded`}
                tone="neutral"
              />
              <AttentionItem
                icon={Radio}
                title="Livestreams"
                value="Manage from Events"
                tone="neutral"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <QuickLink href="/dashboard/events" label="Events" />
              <QuickLink href="/dashboard/analytics" label="Analytics" />
              <QuickLink href="/dashboard/content" label="Content" />
              <QuickLink href="/dashboard/quiz" label="Quiz" />
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Upcoming events</h3>
                <p className="text-sm text-slate-400">Next events from the events API.</p>
              </div>
              <Link href="/dashboard/events" className="text-sm font-semibold text-blue-300 hover:text-blue-200">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {overview.upcomingEvents.slice(0, 4).map((event) => (
                <div key={event._id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <p className="font-semibold text-white">{event.title || event.name || "Untitled event"}</p>
                  <p className="mt-1 text-sm text-slate-400">{formatDate(event.date || event.startDate)}</p>
                </div>
              ))}
              {!isLoading && !overview.upcomingEvents.length && (
                <EmptyPanel message="No upcoming events returned yet." />
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Trending blogs</h3>
                <p className="text-sm text-slate-400">A quick preview from trending analytics.</p>
              </div>
              <Link href="/dashboard/analytics" className="text-sm font-semibold text-blue-300 hover:text-blue-200">
                Details
              </Link>
            </div>

            <div className="space-y-3">
              {trendingBlogs.slice(0, 4).map((blog, index) => (
                <article key={blog._id || index} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 font-semibold text-white">{blog.title}</p>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                    {stripHtml(blog.content) || blog.slug || "No summary available."}
                  </p>
                </article>
              ))}
              {!isLoading && !trendingBlogs.length && (
                <EmptyPanel message="No trending blogs returned yet." />
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-950/70 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{formatNumber(value)}</p>
    </div>
  );
}

function AttentionItem({
  icon: Icon,
  title,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  tone: "good" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
        ? "bg-amber-500/10 text-amber-300"
        : "bg-blue-500/10 text-blue-300";

  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-950/70 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneClass}`}>
        {tone === "good" ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-slate-400">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-blue-500 hover:text-white"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
