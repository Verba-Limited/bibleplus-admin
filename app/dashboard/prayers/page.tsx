"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { DashboardLayout } from "@/components/dashboard-layout";
import { prayersApi, type BibleplusPrayer } from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  Heart,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string; error?: string } } }
    ).response;
    return response?.data?.message || response?.data?.error || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

function getPrayerList(value: unknown): BibleplusPrayer[] {
  if (Array.isArray(value)) return value as BibleplusPrayer[];

  if (value && typeof value === "object") {
    const response = value as { data?: unknown; prayers?: unknown };

    if (Array.isArray(response.data)) {
      return response.data as BibleplusPrayer[];
    }

    if (
      response.data &&
      typeof response.data === "object" &&
      "prayers" in response.data
    ) {
      const prayers = (response.data as { prayers?: unknown }).prayers;
      return Array.isArray(prayers) ? (prayers as BibleplusPrayer[]) : [];
    }

    return Array.isArray(response.prayers)
      ? (response.prayers as BibleplusPrayer[])
      : [];
  }

  return [];
}

function formatDate(value?: string) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getAuthor(prayer: BibleplusPrayer) {
  return (
    prayer.user?.username ||
    prayer.user?.email ||
    prayer.userId ||
    "Unknown user"
  );
}

export default function PrayersPage() {
  const [prayers, setPrayers] = useState<BibleplusPrayer[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredPrayers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return prayers;

    return prayers.filter((prayer) =>
      [
        prayer.title,
        prayer.description,
        prayer.visibility,
        prayer.status,
        prayer.user?.username,
        prayer.user?.email,
        prayer.userId,
        prayer._id,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [prayers, query]);

  const stats = useMemo(
    () => ({
      answered: prayers.filter((prayer) => prayer.isAnswered).length,
      approved: prayers.filter((prayer) => prayer.status === "approved").length,
      pending: prayers.filter((prayer) => prayer.status === "pending").length,
    }),
    [prayers],
  );

  const loadPrayers = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await prayersApi.getMine();
      setPrayers(getPrayerList(response));
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load prayers. Confirm GET /prayer/mine and the admin token.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrayers();
  }, []);

  const handleDelete = async (prayer: BibleplusPrayer) => {
    setBusyId(prayer._id);
    setError("");
    setSuccess("");

    try {
      const response = await prayersApi.delete(prayer._id);
      setPrayers((current) => current.filter((item) => item._id !== prayer._id));
      setPendingDeleteId("");
      setSuccess(response.message || "Prayer deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Delete failed. Confirm DELETE /admin/prayers/:id and the selected prayer ID.",
        ),
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <DashboardLayout title="Prayers">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
              Prayer records
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              Manage prayers
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Review prayers from GET /prayer/mine and remove records when
              needed.
            </p>
          </div>

          <div className="flex w-full gap-2 xl:w-[440px]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search prayers"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={loadPrayers}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Heart} label="Answered" value={stats.answered} />
          <StatCard
            icon={ShieldCheck}
            label="Approved"
            value={stats.approved}
          />
          <StatCard icon={Clock} label="Pending" value={stats.pending} />
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                Prayer list
              </h3>
              <p className="text-sm text-slate-400">
                {filteredPrayers.length} of {prayers.length} records shown
              </p>
            </div>
            <span className="rounded-full border border-amber-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400 font-['IBM_Plex_Mono',monospace]">
              {prayers.length} total
            </span>
          </div>

          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading prayers...
            </div>
          ) : filteredPrayers.length ? (
            <div className="space-y-3">
              {filteredPrayers.map((prayer) => (
                <article
                  key={prayer._id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-white font-['Source_Serif_4',serif]">
                          {prayer.title || "Untitled prayer"}
                        </h4>
                        <Tag>{prayer.visibility || "public"}</Tag>
                        {prayer.status && <Tag>{prayer.status}</Tag>}
                        {prayer.isAnswered && <Tag>answered</Tag>}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm text-slate-400">
                        {prayer.description || "No description."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 font-['IBM_Plex_Mono',monospace]">
                        <span>{formatDate(prayer.createdAt)}</span>
                        <span>{prayer.prayCount ?? 0} prayers</span>
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{getAuthor(prayer)}</span>
                        </span>
                        <span className="truncate">ID: {prayer._id}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(prayer._id)}
                      disabled={busyId === prayer._id}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
                    >
                      {busyId === prayer._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>

                  {pendingDeleteId === prayer._id && (
                    <div className="mt-4">
                      <ConfirmAction
                        message={`Delete "${prayer.title || prayer._id}"? This cannot be undone.`}
                        confirmLabel="Delete prayer"
                        disabled={busyId === prayer._id}
                        onConfirm={() => handleDelete(prayer)}
                        onCancel={() => setPendingDeleteId("")}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
              No prayers found.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white font-['Source_Serif_4',serif]">
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

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300 font-['IBM_Plex_Mono',monospace]">
      {children}
    </span>
  );
}

function Notice({
  tone,
  message,
}: {
  tone: "error" | "success";
  message: string;
}) {
  const isError = tone === "error";

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      }`}
    >
      {isError ? (
        <Clock className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}
