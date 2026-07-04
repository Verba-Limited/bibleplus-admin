"use client";

/**
 * DESIGN NOTES — consistent with the Books page
 * ----------------------------------------------
 * Background/surfaces: unchanged slate-950/900/800 palette.
 * Layered on top, same as Books:
 *   - Source Serif 4  -> section headings
 *   - IBM Plex Mono   -> timestamps, resource IDs, admin ids, IP addresses,
 *                        the "N records" style stamps
 *   - Amber accent    -> here it does real work as action-type badges
 *                        (CREATE = emerald, UPDATE = amber, DELETE = red)
 *                        rather than just decoration.
 *
 * Data shape: the audit-logs endpoint only accepts `page` and `limit`.
 * Search/action/resource filters below are applied client-side against the
 * currently loaded page. If the backend later accepts filter query params,
 * swap the `filteredLogs` memo for values passed into auditLogsApi.getAll().
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { auditLogsApi, type AuditLog } from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  ScrollText,
  Search,
} from "lucide-react";

const ACTION_OPTIONS = ["all", "CREATE", "UPDATE", "DELETE"] as const;
type ActionFilter = (typeof ACTION_OPTIONS)[number];

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string; error?: string } } }
    ).response;
    return response?.data?.message || response?.data?.error || fallback;
  }
  return fallback;
}

function formatTimestamp(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function splitIps(ipAddress?: string) {
  if (!ipAddress) return [];
  return ipAddress
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all");
  const [resourceFilter, setResourceFilter] = useState("all");

  const loadLogs = async (nextPage = page, nextLimit = limit) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await auditLogsApi.getAll({
        page: nextPage,
        limit: nextLimit,
      });
      const data = response.data;
      setLogs(data?.logs || []);
      setTotal(data?.total || 0);
      setPages(data?.pages || 1);
      setPage(data?.page || nextPage);
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load audit logs. Confirm GET /admin/audit-logs and the admin token.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const resourceOptions = useMemo(() => {
    const set = new Set(logs.map((log) => log.resource).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (resourceFilter !== "all" && log.resource !== resourceFilter)
        return false;
      if (!needle) return true;

      return [
        log.adminUsername,
        log.resource,
        log.resourceId,
        log.details,
        log.ipAddress,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [logs, query, actionFilter, resourceFilter]);

  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <DashboardLayout title="Logs">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
              Audit Trail
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              Activity log
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Every admin action recorded, most recent first.
            </p>
          </div>

          <div className="flex w-full gap-2 xl:w-[440px]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search this page's logs"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={() => loadLogs(page, limit)}
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

        {error && <Notice message={error} />}

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400 font-['IBM_Plex_Mono',monospace]">
                <ScrollText className="h-3.5 w-3.5" />
                {filteredLogs.length} of {logs.length} on this page
              </span>
              <span className="text-xs text-slate-500 font-['IBM_Plex_Mono',monospace]">
                {total} total records
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={actionFilter}
                onChange={(value) => setActionFilter(value as ActionFilter)}
                options={ACTION_OPTIONS.map((value) => ({
                  value,
                  label: value === "all" ? "All actions" : value,
                }))}
              />
              <Select
                value={resourceFilter}
                onChange={setResourceFilter}
                options={resourceOptions.map((value) => ({
                  value,
                  label: value === "all" ? "All resources" : value,
                }))}
              />
              <Select
                value={String(limit)}
                onChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
                options={["25", "50", "100"].map((value) => ({
                  value,
                  label: `${value} / page`,
                }))}
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading audit logs...
            </div>
          ) : filteredLogs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 font-medium">Admin</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                    <th className="px-5 py-3 font-medium">Resource</th>
                    <th className="px-5 py-3 font-medium">Details</th>
                    <th className="px-5 py-3 font-medium">IP address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const ips = splitIps(log.ipAddress);
                    return (
                      <tr
                        key={log._id}
                        className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20"
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-400 font-['IBM_Plex_Mono',monospace]">
                          {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-white">
                          {log.adminUsername || "Unknown"}
                        </td>
                        <td className="px-5 py-3.5">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm text-slate-200">
                            {log.resource || "—"}
                          </div>
                          {log.resourceId && (
                            <div
                              className="mt-0.5 max-w-[160px] truncate text-[11px] text-slate-500 font-['IBM_Plex_Mono',monospace]"
                              title={log.resourceId}
                            >
                              {log.resourceId}
                            </div>
                          )}
                        </td>
                        <td
                          className="max-w-[280px] truncate px-5 py-3.5 text-xs text-slate-400 font-['IBM_Plex_Mono',monospace]"
                          title={log.details}
                        >
                          {log.details || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          {ips.length ? (
                            <div>
                              <div className="text-xs text-slate-300 font-['IBM_Plex_Mono',monospace]">
                                {ips[0]}
                              </div>
                              {ips.length > 1 && (
                                <div
                                  className="mt-0.5 text-[11px] text-slate-500 font-['IBM_Plex_Mono',monospace]"
                                  title={ips.join(", ")}
                                >
                                  +{ips.length - 1} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg p-10 text-center text-sm text-slate-400">
              No logs match your filters.
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500 font-['IBM_Plex_Mono',monospace]">
              Showing {rangeStart}–{rangeEnd} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm font-medium text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="px-2 text-sm text-slate-400 font-['IBM_Plex_Mono',monospace]">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(pages, current + 1))
                }
                disabled={page >= pages || isLoading}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm font-medium text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    CREATE: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    UPDATE: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    DELETE: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  const style =
    styles[action] || "border-slate-700 bg-slate-800/50 text-slate-300";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider font-['IBM_Plex_Mono',monospace] ${style}`}
    >
      {action}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs font-medium text-slate-200 outline-none transition-colors focus:border-amber-400"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Notice({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <Clock className="h-4 w-4" />
      {message}
    </div>
  );
}
