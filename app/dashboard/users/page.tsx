"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { DashboardLayout } from "@/components/dashboard-layout";
import { adminUsersApi, type AdminUserRecord } from "@/lib/api";
import {
  Bell,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";

type PaginationState = {
  total: number;
  page: number;
  pages: number;
  limit: number;
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

function getUserName(user?: AdminUserRecord | null) {
  if (!user) return "Unknown user";
  return (
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.username ||
    user.email ||
    "Unknown user"
  );
}

function formatDate(value?: string) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isAdminUserRecord(value: unknown): value is AdminUserRecord {
  return (
    value !== null &&
    typeof value === "object" &&
    "_id" in value &&
    typeof (value as any)._id === "string" &&
    "email" in value &&
    typeof (value as any).email === "string"
  );
}

function getDetailUser(value: unknown): AdminUserRecord | null {
  if (!value || typeof value !== "object") return null;

  const response = value as { data?: unknown };
  const data = response.data;
  if (!data || typeof data !== "object") return null;

  if ("user" in data) {
    const user = (data as { user?: unknown }).user;
    return isAdminUserRecord(user) ? user : null;
  }

  return isAdminUserRecord(data) ? data : null;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    page: 1,
    pages: 1,
    limit: 20,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return users;

    return users.filter((user) =>
      [
        user.email,
        user.firstName,
        user.lastName,
        user.username,
        user.role,
        user.location,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [users, query]);

  const stats = useMemo(
    () => ({
      verified: users.filter((user) => user.verified).length,
      deleted: users.filter((user) => user.isDeleted).length,
      pushEnabled: users.filter((user) => user.notificationSettings?.push)
        .length,
    }),
    [users],
  );

  const loadUsers = async (page = pagination.page) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminUsersApi.getAll({
        page,
        limit: pagination.limit,
      });
      const data = response.data || {};
      const nextUsers = data.users || [];
      setUsers(nextUsers);
      setSelectedId((current) => current || nextUsers[0]?._id || "");
      setPagination({
        total: data.total || nextUsers.length,
        page: data.page || page,
        pages: data.pages || 1,
        limit: pagination.limit,
      });
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load users. Confirm GET /admin/users?page=1&limit=20 and the admin token.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserDetail = async (id: string) => {
    if (!id) return;
    setIsLoadingDetail(true);
    setError("");
    setSuccess("");
    setIsDeletePending(false);

    try {
      const response = await adminUsersApi.getById(id);
      setSelectedUser(getDetailUser(response));
    } catch (err) {
      console.error(err);
      setSelectedUser(users.find((user) => user._id === id) || null);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load user details. Showing the list record instead.",
        ),
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadUsers(1);
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadUserDetail(selectedId);
    } else {
      setSelectedUser(null);
    }
  }, [selectedId]);

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminUsersApi.resetPassword(
        selectedId,
        newPassword.trim() ? { password: newPassword.trim() } : undefined,
      );
      setNewPassword("");
      setSuccess(response.message || "Password reset successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Password reset failed. Confirm PUT /admin/users/:id/reset-password.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminUsersApi.delete(selectedId);
      setUsers((current) => current.filter((user) => user._id !== selectedId));
      setSelectedId("");
      setSelectedUser(null);
      setIsDeletePending(false);
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
      setSuccess(response.message || "User deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "User delete failed. Confirm DELETE /admin/users/:id and the selected user ID.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Users">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">User operations</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Manage users</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Review accounts, load a user profile, reset passwords, and remove
              users from the admin API.
            </p>
          </div>

          <div className="flex w-full gap-2 xl:w-[440px]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search loaded users"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => loadUsers()}
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
            icon={ShieldCheck}
            label="Verified"
            value={stats.verified}
          />
          <StatCard icon={Trash2} label="Deleted" value={stats.deleted} />
          <StatCard
            icon={Bell}
            label="Push enabled"
            value={stats.pushEnabled}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Users</h3>
                <p className="text-sm text-slate-400">
                  {filteredUsers.length} of {users.length} loaded records shown
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                Page {pagination.page} of {pagination.pages}
              </span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading users...
              </div>
            ) : filteredUsers.length ? (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => setSelectedId(user._id)}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selectedId === user._id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">
                            {getUserName(user)}
                          </h4>
                          <Tag>{user.role || "user"}</Tag>
                          <Tag>{user.verified ? "verified" : "unverified"}</Tag>
                        </div>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{user.email}</span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          @{user.username || "no-username"} - Joined{" "}
                          {formatDate(user.createdAt)}
                        </p>
                      </div>
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                          <User className="h-5 w-5" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
                No users found on this page.
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing page {pagination.page} of {pagination.pages} -{" "}
                {pagination.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadUsers(pagination.page - 1)}
                  disabled={isLoading || pagination.page <= 1}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-semibold text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-60"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => loadUsers(pagination.page + 1)}
                  disabled={isLoading || pagination.page >= pagination.pages}
                  className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-semibold text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-60"
                >
                  Next
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Selected user
                  </h3>
                  <p className="text-sm text-slate-400">
                    {selectedUser ? selectedUser._id : "Choose a user."}
                  </p>
                </div>
                {isLoadingDetail ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-500" />
                )}
              </div>

              {selectedUser ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-950 p-4">
                    <p className="font-semibold text-white">
                      {getUserName(selectedUser)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedUser.email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag>{selectedUser.role || "user"}</Tag>
                      <Tag>
                        {selectedUser.verified ? "verified" : "unverified"}
                      </Tag>
                      <Tag>{selectedUser.isDeleted ? "deleted" : "active"}</Tag>
                    </div>
                  </div>

                  <MetaRow
                    icon={User}
                    label="Username"
                    value={selectedUser.username || "No username"}
                  />

                  <MetaRow
                    icon={Bell}
                    label="Notifications"
                    value={`Push ${selectedUser.notificationSettings?.push ? "on" : "off"} / Email ${selectedUser.notificationSettings?.email ? "on" : "off"}`}
                  />
                  <MetaRow
                    icon={Clock}
                    label="Updated"
                    value={formatDate(selectedUser.updatedAt)}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
                  User details will appear here.
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white">
                Reset password
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Leave blank if the backend generates the password.
              </p>
              <form onSubmit={handleResetPassword} className="mt-4 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    New password
                  </span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="Optional"
                      className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={!selectedId || isSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" />
                  )}
                  Reset password
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white">Danger zone</h3>
              <button
                type="button"
                onClick={() => setIsDeletePending(true)}
                disabled={!selectedId || isSaving}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete user
              </button>
              {isDeletePending && selectedUser && (
                <div className="mt-3">
                  <ConfirmAction
                    message={`Delete "${getUserName(selectedUser)}"? This cannot be undone.`}
                    confirmLabel="Delete user"
                    disabled={isSaving}
                    onConfirm={handleDelete}
                    onCancel={() => setIsDeletePending(false)}
                  />
                </div>
              )}
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

function MetaRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-950/70 p-3">
      <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="truncate text-sm font-medium text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold capitalize text-slate-300">
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
