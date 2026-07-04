"use client";

/**
 * DESIGN NOTES — consistent with Books / Logs / System Config / Notifications
 * -------------------------------------------------------------------------
 * Background/surfaces: unchanged slate-950/900/800 palette.
 * Layered on top:
 *   - Source Serif 4  -> headings, item titles
 *   - IBM Plex Mono   -> kicker label, ids, timestamps, counts
 *   - Amber accent    -> active tab, focus rings, "Flag" action
 * Functional colors: emerald = Approve, red = Reject (destructive/DELETE).
 *
 * INTEGRATION NOTE: comment moderation actions (approve/flag/reject) use
 * endpoints assumed symmetric to the prayer ones you gave me. If your
 * backend differs, only moderationApi.approveComment/flagComment/rejectComment
 * in lib/api.ts need to change — nothing in this file does.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  moderationApi,
  type ModerationComment,
  type ModerationPrayer,
  type ModerationQueueCounts,
} from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  Flag,
  Heart,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";

type Tab = "prayers" | "comments";
type StatusFilter = "pending" | "flagged";

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string; error?: string } } }
    ).response;
    return response?.data?.message || response?.data?.error || fallback;
  }
  return fallback;
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

export default function ModerationPage() {
  const [tab, setTab] = useState<Tab>("prayers");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

  const [counts, setCounts] = useState<ModerationQueueCounts | null>(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(true);

  const [prayers, setPrayers] = useState<ModerationPrayer[]>([]);
  const [comments, setComments] = useState<ModerationComment[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  const [busyId, setBusyId] = useState("");
  const [pendingRejectId, setPendingRejectId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const response = await moderationApi.getQueueCounts();
      setCounts(response.data || null);
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load queue counts. Confirm GET /admin/moderation/queue.",
        ),
      );
    } finally {
      setIsLoadingCounts(false);
    }
  };

  const loadList = async () => {
    setIsLoadingList(true);
    setError("");
    setSuccess("");

    try {
      if (tab === "prayers") {
        const response = await moderationApi.getPrayers({
          status: statusFilter,
        });
        setPrayers(response.data?.prayers || []);
      } else {
        const response = await moderationApi.getComments({
          status: statusFilter,
        });
        setComments(response.data?.comments || []);
      }
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          `Could not load ${tab}. Confirm GET /admin/moderation/${tab}?status=${statusFilter}.`,
        ),
      );
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter]);

  const handleApprove = async (id: string) => {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const response =
        tab === "prayers"
          ? await moderationApi.approvePrayer(id)
          : await moderationApi.approveComment(id);

      if (tab === "prayers") {
        setPrayers((current) => current.filter((item) => item._id !== id));
      } else {
        setComments((current) => current.filter((item) => item._id !== id));
      }
      setSuccess(response.message || "Approved successfully.");
      loadCounts();
    } catch (err) {
      console.error(err);
      setError(getRequestErrorMessage(err, "Approve failed. Please retry."));
    } finally {
      setBusyId("");
    }
  };

  const handleFlag = async (id: string) => {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const response =
        tab === "prayers"
          ? await moderationApi.flagPrayer(id)
          : await moderationApi.flagComment(id);

      if (statusFilter === "pending") {
        if (tab === "prayers") {
          setPrayers((current) => current.filter((item) => item._id !== id));
        } else {
          setComments((current) => current.filter((item) => item._id !== id));
        }
      }
      setSuccess(response.message || "Flagged for review.");
      loadCounts();
    } catch (err) {
      console.error(err);
      setError(getRequestErrorMessage(err, "Flag failed. Please retry."));
    } finally {
      setBusyId("");
    }
  };

  const handleReject = async (id: string) => {
    setBusyId(id);
    setError("");
    setSuccess("");

    try {
      const response =
        tab === "prayers"
          ? await moderationApi.rejectPrayer(id)
          : await moderationApi.rejectComment(id);

      if (tab === "prayers") {
        setPrayers((current) => current.filter((item) => item._id !== id));
      } else {
        setComments((current) => current.filter((item) => item._id !== id));
      }
      setPendingRejectId("");
      setSuccess(response.message || "Rejected and removed.");
      loadCounts();
    } catch (err) {
      console.error(err);
      setError(getRequestErrorMessage(err, "Reject failed. Please retry."));
    } finally {
      setBusyId("");
    }
  };

  const items = tab === "prayers" ? prayers : comments;

  return (
    <DashboardLayout title="Moderation">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
              Moderation Queue
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              Review queue
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Approve, flag, or reject pending and flagged prayers and comments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              loadCounts();
              loadList();
            }}
            disabled={isLoadingCounts || isLoadingList}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-60"
          >
            {isLoadingCounts || isLoadingList ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        {/* Queue counts */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <CountCard
            icon={Heart}
            label="Pending prayers"
            value={counts?.pendingPrayers}
            isLoading={isLoadingCounts}
          />
          <CountCard
            icon={ShieldAlert}
            label="Flagged prayers"
            value={counts?.flaggedPrayers}
            isLoading={isLoadingCounts}
            tone="warn"
          />
          <CountCard
            icon={MessageSquare}
            label="Pending comments"
            value={counts?.pendingComments}
            isLoading={isLoadingCounts}
          />
          <CountCard
            icon={ShieldAlert}
            label="Flagged comments"
            value={counts?.flaggedComments}
            isLoading={isLoadingCounts}
            tone="warn"
          />
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          {/* Tabs + filter */}
          <div className="flex flex-col gap-3 border-b border-slate-800 p-5 md:flex-row md:items-center md:justify-between">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1">
              <TabButton
                active={tab === "prayers"}
                onClick={() => setTab("prayers")}
                icon={Heart}
                label="Prayers"
              />
              <TabButton
                active={tab === "comments"}
                onClick={() => setTab("comments")}
                icon={MessageSquare}
                label="Comments"
              />
            </div>

            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-1">
              <FilterButton
                active={statusFilter === "pending"}
                onClick={() => setStatusFilter("pending")}
                label="Pending"
              />
              <FilterButton
                active={statusFilter === "flagged"}
                onClick={() => setStatusFilter("flagged")}
                label="Flagged"
              />
            </div>
          </div>

          {/* List */}
          {isLoadingList ? (
            <div className="flex min-h-[320px] items-center justify-center text-slate-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading {tab}...
            </div>
          ) : items.length ? (
            <div className="space-y-3 p-5">
              {tab === "prayers"
                ? prayers.map((prayer) => (
                    <PrayerRow
                      key={prayer._id}
                      prayer={prayer}
                      isBusy={busyId === prayer._id}
                      isPendingReject={pendingRejectId === prayer._id}
                      onApprove={() => handleApprove(prayer._id)}
                      onFlag={() => handleFlag(prayer._id)}
                      onRequestReject={() => setPendingRejectId(prayer._id)}
                      onCancelReject={() => setPendingRejectId("")}
                      onConfirmReject={() => handleReject(prayer._id)}
                    />
                  ))
                : comments.map((comment) => (
                    <CommentRow
                      key={comment._id}
                      comment={comment}
                      isBusy={busyId === comment._id}
                      isPendingReject={pendingRejectId === comment._id}
                      onApprove={() => handleApprove(comment._id)}
                      onFlag={() => handleFlag(comment._id)}
                      onRequestReject={() => setPendingRejectId(comment._id)}
                      onCancelReject={() => setPendingRejectId("")}
                      onConfirmReject={() => handleReject(comment._id)}
                    />
                  ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm text-slate-400">
              No {statusFilter} {tab} right now.
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}

// ── Prayer row ───────────────────────────────────────────────────────────────

function PrayerRow({
  prayer,
  isBusy,
  isPendingReject,
  onApprove,
  onFlag,
  onRequestReject,
  onCancelReject,
  onConfirmReject,
}: {
  prayer: ModerationPrayer;
  isBusy: boolean;
  isPendingReject: boolean;
  onApprove: () => void;
  onFlag: () => void;
  onRequestReject: () => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-white font-['Source_Serif_4',serif]">
              {prayer.title || "Untitled prayer"}
            </h4>
            <Tag>{prayer.visibility || "public"}</Tag>
            {prayer.status && <Tag>{prayer.status}</Tag>}
            {prayer.isAnswered && <Tag>answered</Tag>}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {prayer.description || "No description."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 font-['IBM_Plex_Mono',monospace]">
            <span>{formatDate(prayer.createdAt)}</span>
            <span>{prayer.prayCount ?? 0} prayers</span>
            <span className="truncate">user: {prayer.userId}</span>
          </div>
        </div>

        <ActionButtons
          isBusy={isBusy}
          onApprove={onApprove}
          onFlag={onFlag}
          onRequestReject={onRequestReject}
        />
      </div>

      {isPendingReject && (
        <div className="mt-4">
          <ConfirmAction
            message={`Reject "${prayer.title || prayer._id}"? This deletes it and cannot be undone.`}
            confirmLabel="Reject prayer"
            disabled={isBusy}
            onConfirm={onConfirmReject}
            onCancel={onCancelReject}
          />
        </div>
      )}
    </article>
  );
}

// ── Comment row ──────────────────────────────────────────────────────────────

function CommentRow({
  comment,
  isBusy,
  isPendingReject,
  onApprove,
  onFlag,
  onRequestReject,
  onCancelReject,
  onConfirmReject,
}: {
  comment: ModerationComment;
  isBusy: boolean;
  isPendingReject: boolean;
  onApprove: () => void;
  onFlag: () => void;
  onRequestReject: () => void;
  onCancelReject: () => void;
  onConfirmReject: () => void;
}) {
  const body = comment.content || comment.text || comment.message || "";

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {comment.status && <Tag>{comment.status}</Tag>}
            {comment.resourceType && <Tag>{comment.resourceType}</Tag>}
          </div>
          <p className="mt-2 text-sm text-slate-300">
            {body || "No comment body."}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 font-['IBM_Plex_Mono',monospace]">
            <span>{formatDate(comment.createdAt)}</span>
            {comment.userId && (
              <span className="truncate">user: {comment.userId}</span>
            )}
            {comment.resourceId && (
              <span className="truncate">on: {comment.resourceId}</span>
            )}
          </div>
        </div>

        <ActionButtons
          isBusy={isBusy}
          onApprove={onApprove}
          onFlag={onFlag}
          onRequestReject={onRequestReject}
        />
      </div>

      {isPendingReject && (
        <div className="mt-4">
          <ConfirmAction
            message={`Reject this comment (${comment._id})? This deletes it and cannot be undone.`}
            confirmLabel="Reject comment"
            disabled={isBusy}
            onConfirm={onConfirmReject}
            onCancel={onCancelReject}
          />
        </div>
      )}
    </article>
  );
}

// ── Shared bits ──────────────────────────────────────────────────────────────

function ActionButtons({
  isBusy,
  onApprove,
  onFlag,
  onRequestReject,
}: {
  isBusy: boolean;
  onApprove: () => void;
  onFlag: () => void;
  onRequestReject: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={onApprove}
        disabled={isBusy}
        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/15 disabled:opacity-60"
      >
        {isBusy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" />
        )}
        Approve
      </button>
      <button
        type="button"
        onClick={onFlag}
        disabled={isBusy}
        className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/15 disabled:opacity-60"
      >
        <Flag className="h-3.5 w-3.5" />
        Flag
      </button>
      <button
        type="button"
        onClick={onRequestReject}
        disabled={isBusy}
        className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Reject
      </button>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-amber-400 text-slate-950"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-800 text-white"
          : "text-slate-500 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}

function CountCard({
  icon: Icon,
  label,
  value,
  isLoading,
  tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: number;
  isLoading: boolean;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          {isLoading ? (
            <Loader2 className="mt-2 h-5 w-5 animate-spin text-slate-500" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              {value ?? 0}
            </p>
          )}
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            tone === "warn"
              ? "bg-amber-400/10 text-amber-300"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
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
