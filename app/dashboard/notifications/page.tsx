"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  notificationsApi,
  type BibleplusNotification,
  type NotificationPayload,
  type SendNotificationPayload,
} from "@/lib/api";
import {
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserRound,
} from "lucide-react";

type DirectForm = SendNotificationPayload;
type BroadcastForm = NotificationPayload;
type PaginationState = {
  total: number;
  page: number;
  limit: number;
};

const emptyDirectForm: DirectForm = {
  userId: "",
  title: "",
  message: "",
};

const emptyBroadcastForm: BroadcastForm = {
  title: "",
  message: "",
};

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string; error?: string } } }
    ).response;
    return response?.data?.message || response?.data?.error || fallback;
  }

  return fallback;
}

function toNotificationList(value: unknown): BibleplusNotification[] {
  if (Array.isArray(value)) return value as BibleplusNotification[];
  if (value && typeof value === "object") {
    const data = value as {
      data?: BibleplusNotification[];
      notifications?: BibleplusNotification[];
      results?: BibleplusNotification[];
    };
    return data.data || data.notifications || data.results || [];
  }
  return [];
}

function getPagination(value: unknown): PaginationState {
  if (value && typeof value === "object") {
    const data = value as {
      total?: number;
      count?: number;
      page?: number;
      limit?: number;
    };
    return {
      total: data.total || data.count || 0,
      page: data.page || 1,
      limit: data.limit || 20,
    };
  }

  return { total: 0, page: 1, limit: 20 };
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<BibleplusNotification[]>(
    [],
  );
  const [query, setQuery] = useState("");
  const [directForm, setDirectForm] =
    useState<DirectForm>(emptyDirectForm);
  const [broadcastForm, setBroadcastForm] =
    useState<BroadcastForm>(emptyBroadcastForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [busyNotificationId, setBusyNotificationId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredNotifications = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return notifications;

    return notifications.filter((notification) =>
      [
        notification.title,
        notification.message,
        notification.type,
        notification.target,
        notification.userId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [notifications, query]);

  const unreadCount = notifications.filter(
    (notification) => notification.read === false,
  ).length;
  const broadcastCount = notifications.filter(
    (notification) =>
      notification.type === "broadcast" || notification.target === "ALL",
  ).length;
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.limit));

  const loadNotifications = async (page = pagination.page) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await notificationsApi.getAll({
        page,
        limit: pagination.limit,
      });
      setNotifications(toNotificationList(response));
      setPagination(getPagination(response));
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load notifications. Confirm GET /admin/notifications/all and the admin token.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleSendToUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !directForm.userId.trim() ||
      !directForm.title.trim() ||
      !directForm.message.trim()
    ) {
      setError("User ID, title, and message are required.");
      return;
    }

    setIsSendingDirect(true);
    setError("");
    setSuccess("");

    try {
      const response = await notificationsApi.sendToUser({
        userId: directForm.userId.trim(),
        title: directForm.title.trim(),
        message: directForm.message.trim(),
      });
      await loadNotifications();
      setDirectForm(emptyDirectForm);
      setSuccess(response.message || "Notification sent to user.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Send failed. Confirm POST /admin/notifications/send and the JSON body.",
        ),
      );
    } finally {
      setIsSendingDirect(false);
    }
  };

  const handleBroadcast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      setError("Broadcast title and message are required.");
      return;
    }

    setIsBroadcasting(true);
    setError("");
    setSuccess("");

    try {
      const response = await notificationsApi.broadcast({
        title: broadcastForm.title.trim(),
        message: broadcastForm.message.trim(),
      });
      if (response.data) {
        setNotifications((current) => [
          response.data as BibleplusNotification,
          ...current,
        ]);
      } else {
        await loadNotifications();
      }
      setBroadcastForm(emptyBroadcastForm);
      setSuccess(response.message || "Broadcast sent to all users.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Broadcast failed. Confirm POST /admin/notifications/broadcast and the JSON body.",
        ),
      );
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleResend = async (notification: BibleplusNotification) => {
    setBusyNotificationId(notification._id);
    setError("");
    setSuccess("");

    try {
      const response = await notificationsApi.resend(notification._id);
      setSuccess(response.message || "Notification resent successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Resend failed. Confirm POST /admin/notifications/:id/resend and the notification ID.",
        ),
      );
    } finally {
      setBusyNotificationId("");
    }
  };

  const handleDelete = async (notification: BibleplusNotification) => {
    setBusyNotificationId(notification._id);
    setError("");
    setSuccess("");

    try {
      const response = await notificationsApi.delete(notification._id);
      setNotifications((current) =>
        current.filter((item) => item._id !== notification._id),
      );
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
      setPendingDeleteId("");
      setSuccess(response.message || "Notification deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Delete failed. Confirm DELETE /admin/notifications/:id and the notification ID.",
        ),
      );
    } finally {
      setBusyNotificationId("");
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">
              Notification center
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Send and review notifications
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Send a direct notification to one user, broadcast to everyone,
              and review recent notification records.
            </p>
          </div>

          <div className="flex w-full gap-2 xl:w-[440px]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notifications"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => loadNotifications()}
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
          <StatCard
            icon={Bell}
            label="Total notifications"
            value={notifications.length}
          />
          <StatCard icon={Clock} label="Unread" value={unreadCount} />
          <StatCard
            icon={Megaphone}
            label="Broadcasts"
            value={broadcastCount}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Notification history
                </h3>
                <p className="text-sm text-slate-400">
                  {filteredNotifications.length} of {notifications.length}{" "}
                  records shown
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                Page {pagination.page} of {totalPages}
              </span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading notifications...
              </div>
            ) : filteredNotifications.length ? (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <article
                    key={notification._id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="line-clamp-1 text-sm font-semibold text-white">
                            {notification.title || "Untitled notification"}
                          </h4>
                          <Tag>
                            {notification.type ||
                              (notification.target === "ALL"
                                ? "broadcast"
                                : "direct")}
                          </Tag>
                          {notification.read === false && <Tag>unread</Tag>}
                        </div>
                        <p className="mt-2 text-sm text-slate-400">
                          {notification.message || "No message body."}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 md:items-end">
                        <p className="text-xs text-slate-500">
                          {formatDate(notification.createdAt)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleResend(notification)}
                            disabled={busyNotificationId === notification._id}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-60"
                          >
                            {busyNotificationId === notification._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Resend
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(notification._id)}
                            disabled={busyNotificationId === notification._id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span>ID: {notification._id}</span>
                      {(notification.target || notification.userId) && (
                        <span>
                          Target: {notification.target || notification.userId}
                        </span>
                      )}
                    </div>

                    {pendingDeleteId === notification._id && (
                      <div className="mt-4">
                        <ConfirmAction
                          message={`Delete "${notification.title || notification._id}"? This cannot be undone.`}
                          confirmLabel="Delete notification"
                          disabled={busyNotificationId === notification._id}
                          onConfirm={() => handleDelete(notification)}
                          onCancel={() => setPendingDeleteId("")}
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
                No notifications found.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing page {pagination.page} of {totalPages} -{" "}
                {pagination.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadNotifications(pagination.page - 1)}
                  disabled={isLoading || pagination.page <= 1}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-semibold text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-60"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => loadNotifications(pagination.page + 1)}
                  disabled={isLoading || pagination.page >= totalPages}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-semibold text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Send to user
                  </h3>
                  <p className="text-sm text-slate-400">
                    Notify a specific user
                  </p>
                </div>
              </div>

              <form onSubmit={handleSendToUser} className="space-y-4">
                <TextField
                  label="User ID"
                  value={directForm.userId}
                  placeholder="USER_ID"
                  onChange={(value) =>
                    setDirectForm((current) => ({
                      ...current,
                      userId: value,
                    }))
                  }
                />
                <TextField
                  label="Title"
                  value={directForm.title}
                  placeholder="Hello"
                  onChange={(value) =>
                    setDirectForm((current) => ({
                      ...current,
                      title: value,
                    }))
                  }
                />
                <TextArea
                  label="Message"
                  value={directForm.message}
                  placeholder="Message body"
                  onChange={(value) =>
                    setDirectForm((current) => ({
                      ...current,
                      message: value,
                    }))
                  }
                />
                <button
                  type="submit"
                  disabled={
                    isSendingDirect ||
                    !directForm.userId.trim() ||
                    !directForm.title.trim() ||
                    !directForm.message.trim()
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  {isSendingDirect ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send notification
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-300">
                  <Megaphone className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Broadcast
                  </h3>
                  <p className="text-sm text-slate-400">
                    Send to all users
                  </p>
                </div>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-4">
                <TextField
                  label="Title"
                  value={broadcastForm.title}
                  placeholder="Global Alert"
                  onChange={(value) =>
                    setBroadcastForm((current) => ({
                      ...current,
                      title: value,
                    }))
                  }
                />
                <TextArea
                  label="Message"
                  value={broadcastForm.message}
                  placeholder="System maintenance at midnight"
                  onChange={(value) =>
                    setBroadcastForm((current) => ({
                      ...current,
                      message: value,
                    }))
                  }
                />
                <button
                  type="submit"
                  disabled={
                    isBroadcasting ||
                    !broadcastForm.title.trim() ||
                    !broadcastForm.message.trim()
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-500 disabled:opacity-60"
                >
                  {isBroadcasting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Megaphone className="h-4 w-4" />
                  )}
                  Send broadcast
                </button>
              </form>
            </section>
          </aside>
        </div>
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
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold capitalize text-slate-300">
      {children}
    </span>
  );
}

function TextField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
      />
    </label>
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
