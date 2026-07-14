"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  adminManagementApi,
  type AdminManagementPayload,
  type AdminManagementUser,
} from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";

const emptyForm: AdminManagementPayload = {
  username: "",
  email: "",
  password: "",
  role: "editor",
};

const roleOptions = ["editor", "admin", "superadmin"];

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as { response?: { data?: { message?: string; error?: string } } }
    ).response;
    return response?.data?.message || response?.data?.error || fallback;
  }

  return error instanceof Error ? error.message : fallback;
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

function getAdminList(value: unknown): AdminManagementUser[] {
  if (Array.isArray(value)) return value as AdminManagementUser[];
  if (value && typeof value === "object") {
    const response = value as { data?: unknown };
    return Array.isArray(response.data)
      ? (response.data as AdminManagementUser[])
      : [];
  }

  return [];
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminManagementUser[]>([]);
  const [form, setForm] = useState<AdminManagementPayload>(emptyForm);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filteredAdmins = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return admins;

    return admins.filter((admin) =>
      [admin.username, admin.email, admin.role, admin._id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [admins, query]);

  const roleCounts = useMemo(
    () => ({
      superadmin: admins.filter((admin) => admin.role === "superadmin").length,
      admin: admins.filter((admin) => admin.role === "admin").length,
      editor: admins.filter((admin) => admin.role === "editor").length,
    }),
    [admins],
  );

  const loadAdmins = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminManagementApi.getAll();
      setAdmins(getAdminList(response));
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load admins. Confirm GET /admin/management and the admin token.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.username.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.role.trim()
    ) {
      setError("Username, email, password, and role are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await adminManagementApi.create({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      if (response.data) {
        setAdmins((current) => [response.data as AdminManagementUser, ...current]);
      } else {
        await loadAdmins();
      }

      setForm(emptyForm);
      setSuccess(response.message || "Admin account created successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Create failed. Confirm POST /admin/management and the payload fields.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (admin: AdminManagementUser) => {
    setBusyId(admin._id);
    setError("");
    setSuccess("");

    try {
      const response = await adminManagementApi.delete(admin._id);
      setAdmins((current) => current.filter((item) => item._id !== admin._id));
      setPendingDeleteId("");
      setSuccess(response.message || "Admin account deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Delete failed. Confirm DELETE /admin/management/:id and the selected admin ID.",
        ),
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <DashboardLayout title="Admin Management">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
              Access control
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              Manage admin accounts
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Create admin users, review roles, and remove accounts from the
              management endpoint.
            </p>
          </div>

          <div className="flex w-full gap-2 xl:w-[440px]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search admins"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={loadAdmins}
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
            label="Super admins"
            value={roleCounts.superadmin}
          />
          <StatCard icon={UserCog} label="Admins" value={roleCounts.admin} />
          <StatCard icon={Mail} label="Editors" value={roleCounts.editor} />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                  Admin accounts
                </h3>
                <p className="text-sm text-slate-400">
                  {filteredAdmins.length} of {admins.length} records shown
                </p>
              </div>
              <span className="rounded-full border border-amber-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400 font-['IBM_Plex_Mono',monospace]">
                {admins.length} total
              </span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading admins...
              </div>
            ) : filteredAdmins.length ? (
              <div className="space-y-3">
                {filteredAdmins.map((admin) => (
                  <article
                    key={admin._id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-white font-['Source_Serif_4',serif]">
                            {admin.username || "Unnamed admin"}
                          </h4>
                          <Tag>{admin.role || "admin"}</Tag>
                        </div>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">
                            {admin.email || "No email"}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-slate-500 font-['IBM_Plex_Mono',monospace]">
                          ID: {admin._id} - Joined {formatDate(admin.createdAt)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(admin._id)}
                        disabled={busyId === admin._id}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
                      >
                        {busyId === admin._id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete
                      </button>
                    </div>

                    {pendingDeleteId === admin._id && (
                      <div className="mt-4">
                        <ConfirmAction
                          message={`Delete "${admin.username || admin._id}"? This cannot be undone.`}
                          confirmLabel="Delete admin"
                          disabled={busyId === admin._id}
                          onConfirm={() => handleDelete(admin)}
                          onCancel={() => setPendingDeleteId("")}
                        />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
                No admin accounts found.
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                <UserCog className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                  Create admin
                </h3>
                <p className="text-sm text-slate-400">
                  Add a new account to admin management.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <TextField
                label="Username"
                value={form.username}
                placeholder="new_editor"
                onChange={(value) =>
                  setForm((current) => ({ ...current, username: value }))
                }
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                placeholder="editor@bibleplus.com"
                onChange={(value) =>
                  setForm((current) => ({ ...current, email: value }))
                }
              />
              <TextField
                label="Password"
                type="password"
                value={form.password}
                placeholder="securepassword"
                onChange={(value) =>
                  setForm((current) => ({ ...current, password: value }))
                }
              />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Role
                </span>
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors focus:border-amber-400"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={
                  isSaving ||
                  !form.username.trim() ||
                  !form.email.trim() ||
                  !form.password.trim() ||
                  !form.role.trim()
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Create admin
              </button>
            </form>
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

function TextField({
  label,
  type = "text",
  value,
  placeholder,
  onChange,
}: {
  label: string;
  type?: string;
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
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
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
