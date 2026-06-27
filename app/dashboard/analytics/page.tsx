"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  analyticsApi,
  type AnalyticsActivityDay,
  type AnalyticsOverview,
  type AnalyticsTrending,
  type SystemHealth,
} from "@/lib/api";
import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  Database,
  Heart,
  Loader2,
  RefreshCw,
  Server,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsState = {
  overview: AnalyticsOverview | null;
  activity: AnalyticsActivityDay[];
  trending: AnalyticsTrending | null;
  system: SystemHealth | null;
};

const emptyState: AnalyticsState = {
  overview: null,
  activity: [],
  trending: null,
  system: null,
};

const numberFormatter = new Intl.NumberFormat("en");

function fulfilledData<T>(result: PromiseSettledResult<{ data?: T }>) {
  return result.status === "fulfilled" ? result.value.data : undefined;
}

function formatNumber(value?: number) {
  return numberFormatter.format(value || 0);
}

function formatBytes(value?: number) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatUptime(seconds?: number) {
  if (!seconds) return "0m";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function stripHtml(value?: string) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsState>(emptyState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError("");

    try {
      const [overview, activity, trending, system] = await Promise.allSettled([
        analyticsApi.getOverview(),
        analyticsApi.getActivity(),
        analyticsApi.getTrending(),
        analyticsApi.getSystemHealth(),
      ]);

      setAnalytics({
        overview: fulfilledData(overview) || null,
        activity: fulfilledData(activity) || [],
        trending: fulfilledData(trending) || null,
        system: fulfilledData(system) || null,
      });

      const failedCount = [overview, activity, trending, system].filter(
        (result) => result.status === "rejected",
      ).length;

      if (failedCount) {
        setError(
          `${failedCount} analytics request${failedCount > 1 ? "s" : ""} timed out or failed. Showing the data that loaded.`,
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        "Could not load analytics right now. Check the API token or try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const totalActivity = useMemo(
    () =>
      analytics.activity.reduce(
        (totals, day) => ({
          users: totals.users + (day.users || 0),
          blogs: totals.blogs + (day.blogs || 0),
          prayers: totals.prayers + (day.prayers || 0),
          events: totals.events + (day.events || 0),
        }),
        { users: 0, blogs: 0, prayers: 0, events: 0 },
      ),
    [analytics.activity],
  );

  const memoryUsed = analytics.system?.memory.heapUsed || 0;
  const memoryTotal = analytics.system?.memory.heapTotal || 0;
  const memoryPercent = memoryTotal
    ? Math.min(100, Math.round((memoryUsed / memoryTotal) * 100))
    : 0;

  return (
    <DashboardLayout title="Analytics">
      <div className="px-4 md:px-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">Admin analytics</p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              BiblePlus performance
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Live overview, activity trends, trending posts, and backend health
              from the admin analytics API.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAnalytics}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Total users"
            value={formatNumber(analytics.overview?.totalUsers)}
          />
          <MetricCard
            icon={BookOpen}
            label="Blogs"
            value={formatNumber(analytics.overview?.totalBlogs)}
          />
          <MetricCard
            icon={CalendarDays}
            label="Events"
            value={formatNumber(analytics.overview?.totalEvents)}
          />
          <MetricCard
            icon={Bell}
            label="Notifications"
            value={formatNumber(analytics.overview?.totalNotifications)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricCard
            icon={Heart}
            label="Prayers"
            value={formatNumber(analytics.overview?.totalPrayers)}
            compact
          />
          <MetricCard
            icon={Activity}
            label="Likes"
            value={formatNumber(analytics.overview?.totalLikes)}
            compact
          />
          <MetricCard
            icon={BookOpen}
            label="Bookmarks"
            value={formatNumber(analytics.overview?.totalBookmarks)}
            compact
          />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,0.9fr)]">
          <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Daily activity
                </h3>
                <p className="text-sm text-slate-400">
                  Users, blogs, prayers, and events by date.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <ActivityPill
                  label="Users"
                  value={totalActivity.users}
                  color="bg-blue-400"
                />
                <ActivityPill
                  label="Blogs"
                  value={totalActivity.blogs}
                  color="bg-emerald-400"
                />
                <ActivityPill
                  label="Prayers"
                  value={totalActivity.prayers}
                  color="bg-pink-400"
                />
                <ActivityPill
                  label="Events"
                  value={totalActivity.events}
                  color="bg-amber-400"
                />
              </div>
            </div>

            <div className="h-[330px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={analytics.activity}>
                  <defs>
                    <linearGradient
                      id="activityUsers"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#60a5fa"
                        stopOpacity={0.35}
                      />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#60a5fa"
                    fill="url(#activityUsers)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="blogs"
                    stroke="#34d399"
                    fill="#34d39922"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="prayers"
                    stroke="#f472b6"
                    fill="#f472b622"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#fbbf24"
                    fill="#fbbf2422"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                System health
              </h3>
              <p className="text-sm text-slate-400">
                Backend availability and memory usage.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-slate-950/70 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
                    <Database className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">MongoDB</p>
                    <p className="text-xs text-slate-400">Connection status</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold capitalize text-emerald-300">
                  {analytics.system?.mongoStatus || "unknown"}
                </span>
              </div>

              <div className="rounded-lg bg-slate-950/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                      <Server className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">Memory</p>
                      <p className="text-xs text-slate-400">
                        {formatBytes(memoryUsed)} of {formatBytes(memoryTotal)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    {memoryPercent}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${memoryPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MiniStat
                  label="Uptime"
                  value={formatUptime(analytics.system?.uptime)}
                />
                <MiniStat
                  label="RSS"
                  value={formatBytes(analytics.system?.memory.rss)}
                />
                <MiniStat
                  label="External"
                  value={formatBytes(analytics.system?.memory.external)}
                />
                <MiniStat
                  label="Array buffers"
                  value={formatBytes(analytics.system?.memory.arrayBuffers)}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(340px,0.9fr)_minmax(0,1.3fr)]">
          <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Trending blogs
              </h3>
              <p className="text-sm text-slate-400">
                Top content returned by the trending endpoint.
              </p>
            </div>
            <div className="space-y-3">
              {(analytics.trending?.trendingBlogs || [])
                .slice(0, 5)
                .map((blog, index) => (
                  <article
                    key={blog._id || index}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h4 className="line-clamp-2 text-sm font-semibold text-white">
                        {blog.title}
                      </h4>
                      <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-xs leading-5 text-slate-400">
                      {stripHtml(blog.content) ||
                        blog.slug ||
                        "No summary available."}
                    </p>
                  </article>
                ))}
              {!isLoading && !analytics.trending?.trendingBlogs?.length && (
                <EmptyPanel message="No trending blogs returned yet." />
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Content mix</h3>
              <p className="text-sm text-slate-400">
                High-level distribution from the overview endpoint.
              </p>
            </div>
            <div className="h-[320px] min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart
                  barSize={32}
                  data={[
                    {
                      name: "Users",
                      value: analytics.overview?.totalUsers || 0,
                    },
                    {
                      name: "Blogs",
                      value: analytics.overview?.totalBlogs || 0,
                    },
                    {
                      name: "Events",
                      value: analytics.overview?.totalEvents || 0,
                    },
                    {
                      name: "Prayers",
                      value: analytics.overview?.totalPrayers || 0,
                    },
                    {
                      name: "Notifications",
                      value: analytics.overview?.totalNotifications || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="value" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
  compact = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p
            className={`${compact ? "mt-1 text-2xl" : "mt-2 text-3xl"} font-bold text-white`}
          >
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function ActivityPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-slate-950/70 px-3 py-2">
      <div className="flex items-center justify-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        <span className="text-slate-400">{label}</span>
      </div>
      <p className="mt-1 font-semibold text-white">{formatNumber(value)}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
