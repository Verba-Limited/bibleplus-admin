"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { exportsApi, type ExportKind } from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";

type ExportState = {
  csv: string;
  isLoading: boolean;
};

const initialExports: Record<ExportKind, ExportState> = {
  users: { csv: "", isLoading: false },
  prayers: { csv: "", isLoading: false },
};

const exportConfig: Record<
  ExportKind,
  {
    title: string;
    description: string;
    filename: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  users: {
    title: "Users export",
    description: "Download registered users with account and profile fields.",
    filename: "bibleplus-users",
    icon: Users,
  },
  prayers: {
    title: "Prayers export",
    description: "Download prayer records with status, author, and counts.",
    filename: "bibleplus-prayers",
    icon: FileDown,
  },
};

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string; error?: string } } }
    ).response;
    return response?.data?.message || response?.data?.error || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

function getCsvRows(csv: string) {
  const rows: string[] = [];
  let row = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && next === '"') {
      row += char;
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      row += char;
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (row.trim()) rows.push(row);
      row = "";
      if (char === "\r" && next === "\n") index += 1;
      continue;
    }

    row += char;
  }

  if (row.trim()) rows.push(row);
  return rows;
}

function getDatedFilename(prefix: string) {
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}-${date}.csv`;
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ExportsPage() {
  const [exports, setExports] =
    useState<Record<ExportKind, ExportState>>(initialExports);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totals = useMemo(
    () => ({
      users: Math.max(0, getCsvRows(exports.users.csv).length - 1),
      prayers: Math.max(0, getCsvRows(exports.prayers.csv).length - 1),
    }),
    [exports],
  );

  const loadExport = async (kind: ExportKind) => {
    setExports((current) => ({
      ...current,
      [kind]: { ...current[kind], isLoading: true },
    }));
    setError("");
    setSuccess("");

    try {
      const csv =
        kind === "users"
          ? await exportsApi.getUsers()
          : await exportsApi.getPrayers();
      setExports((current) => ({
        ...current,
        [kind]: { csv, isLoading: false },
      }));
      setSuccess(`${exportConfig[kind].title} loaded.`);
      return csv;
    } catch (err) {
      console.error(err);
      setExports((current) => ({
        ...current,
        [kind]: { ...current[kind], isLoading: false },
      }));
      setError(
        getRequestErrorMessage(
          err,
          `Could not load ${kind} export. Confirm GET /admin/exports/${kind} and the admin token.`,
        ),
      );
      return "";
    }
  };

  const handleDownload = async (kind: ExportKind) => {
    const currentCsv = exports[kind].csv;
    const csv = currentCsv || (await loadExport(kind));

    if (!csv) return;

    downloadCsv(csv, getDatedFilename(exportConfig[kind].filename));
    setSuccess(`${exportConfig[kind].title} downloaded.`);
  };

  return (
    <DashboardLayout title="Exports">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
              Data exports
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              Download CSV reports
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Fetch user and prayer CSV files from the admin export endpoints.
            </p>
          </div>
        </div>

        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard icon={Users} label="Loaded users" value={totals.users} />
          <StatCard
            icon={FileDown}
            label="Loaded prayers"
            value={totals.prayers}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ExportPanel
            kind="users"
            csv={exports.users.csv}
            isLoading={exports.users.isLoading}
            onPreview={() => loadExport("users")}
            onDownload={() => handleDownload("users")}
          />
          <ExportPanel
            kind="prayers"
            csv={exports.prayers.csv}
            isLoading={exports.prayers.isLoading}
            onPreview={() => loadExport("prayers")}
            onDownload={() => handleDownload("prayers")}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function ExportPanel({
  kind,
  csv,
  isLoading,
  onPreview,
  onDownload,
}: {
  kind: ExportKind;
  csv: string;
  isLoading: boolean;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const config = exportConfig[kind];
  const Icon = config.icon;
  const rows = getCsvRows(csv);
  const preview = rows.slice(0, 8).join("\n");
  const rowCount = Math.max(0, rows.length - 1);

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
              {config.title}
            </h3>
            <p className="text-sm text-slate-400">{config.description}</p>
          </div>
        </div>
        <span className="flex rounded-full border border-amber-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400 font-['IBM_Plex_Mono',monospace]">
          {rowCount} rows
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onPreview}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-900 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Load preview
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download CSV
        </button>
      </div>

      <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-['IBM_Plex_Mono',monospace]">
          Preview
        </div>
        {preview ? (
          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap p-4 text-xs leading-5 text-slate-300 font-['IBM_Plex_Mono',monospace]">
            {preview}
          </pre>
        ) : (
          <div className="p-8 text-center text-sm text-slate-400">
            Load this export to preview the first rows.
          </div>
        )}
      </div>
    </section>
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
