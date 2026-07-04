"use client";

/**
 * DESIGN NOTES — consistent with Books / Logs
 * ---------------------------------------------
 * Background/surfaces: unchanged slate-950/900/800 palette.
 * Layered on top:
 *   - Source Serif 4  -> headings, card titles
 *   - IBM Plex Mono   -> config keys, kicker labels
 *   - Amber accent    -> primary buttons, focus rings, the "Create config"
 *                        panel (this is now the shared primary accent, so
 *                        the "Edit config" panel uses a neutral slate
 *                        highlight instead, to keep the two panels visually
 *                        distinct rather than both competing for amber).
 * Functional colors kept as-is: emerald for "on"/success, red for delete/error.
 */

import { useEffect, useState, FormEvent } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import axiosInstance from "@/lib/axios";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Settings,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface SystemConfig {
  _id: string;
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: { message?: string; error?: string };
          status?: number;
        };
      }
    ).response;

    return response?.data?.message || response?.data?.error || fallback;
  }

  return fallback;
}

// ── API helpers ───────────────────────────────────────────────────────────────

const systemConfigApi = {
  getAll: async (): Promise<ApiResponse<SystemConfig[]>> => {
    const res = await axiosInstance.get<ApiResponse<SystemConfig[]>>(
      "/admin/system-config",
    );
    return res.data;
  },

  update: async (
    key: string,
    value: string,
  ): Promise<ApiResponse<SystemConfig>> => {
    const res = await axiosInstance.put<ApiResponse<SystemConfig>>(
      `/admin/system-config/${key}`,
      { value },
    );
    return res.data;
  },

  create: async (payload: {
    key: string;
    value: string;
    type: string;
    label: string;
    category: string;
    description?: string;
  }): Promise<ApiResponse<SystemConfig>> => {
    const res = await axiosInstance.post<ApiResponse<SystemConfig>>(
      "/admin/system-config",
      payload,
    );
    return res.data;
  },
};

// ── Category label map ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  feature_flags: "Feature Flags",
  notifications: "Notifications",
  system: "System",
};

const CATEGORY_ORDER = ["system", "feature_flags", "content", "notifications"];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [createForm, setCreateForm] = useState({
    key: "",
    value: "true",
    type: "boolean",
    label: "",
    category: "feature_flags",
    description: "",
  });

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadConfigs = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await systemConfigApi.getAll();
      if (res.success && Array.isArray(res.data)) {
        setConfigs(res.data);
      } else {
        setError("Failed to load system configuration.");
      }
    } catch {
      setError("Could not reach the system config endpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // ── Toggle boolean ────────────────────────────────────────────────────────

  const handleToggle = async (config: SystemConfig) => {
    if (config.type !== "boolean") return;
    const next = config.value === "true" ? "false" : "true";

    setTogglingKey(config.key);
    setError("");
    setSuccess("");

    // Optimistic update
    setConfigs((prev) =>
      prev.map((c) => (c.key === config.key ? { ...c, value: next } : c)),
    );

    try {
      const res = await systemConfigApi.update(config.key, next);
      if (res.success) {
        setSuccess(res.message || `"${config.label}" updated.`);
        if (res.data) {
          setConfigs((prev) =>
            prev.map((c) => (c.key === config.key ? res.data! : c)),
          );
        }
      } else {
        // Revert on failure
        setConfigs((prev) =>
          prev.map((c) =>
            c.key === config.key ? { ...c, value: config.value } : c,
          ),
        );
        setError(res.message || "Update failed.");
      }
    } catch (err) {
      setConfigs((prev) =>
        prev.map((c) =>
          c.key === config.key ? { ...c, value: config.value } : c,
        ),
      );
      setError(
        getRequestErrorMessage(
          err,
          "Update failed. Check the API and try again.",
        ),
      );
    } finally {
      setTogglingKey(null);
    }
  };

  const startEditing = (config: SystemConfig) => {
    setEditingConfig(config);
    setEditValue(config.value);
    setError("");
    setSuccess("");
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingConfig) return;

    setIsUpdating(true);
    setError("");
    setSuccess("");

    try {
      const nextValue = editValue.trim();
      const res = await systemConfigApi.update(editingConfig.key, nextValue);
      if (res.success) {
        setConfigs((prev) =>
          prev.map((config) =>
            config.key === editingConfig.key
              ? res.data || { ...config, value: nextValue }
              : config,
          ),
        );
        setSuccess(res.message || `"${editingConfig.label}" updated.`);
        setEditingConfig(null);
        setEditValue("");
      } else {
        setError(res.message || "Update failed.");
      }
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Update failed. Check the API and try again.",
        ),
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createForm.key.trim() || !createForm.label.trim()) return;

    const normalizedKey = createForm.key.trim();
    const existingConfig = configs.find(
      (config) => config.key.toLowerCase() === normalizedKey.toLowerCase(),
    );

    if (existingConfig) {
      setError(
        `"${normalizedKey}" already exists. Update the existing config instead of creating a duplicate key.`,
      );
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await systemConfigApi.create({
        ...createForm,
        key: normalizedKey,
        label: createForm.label.trim(),
        category: createForm.category.trim(),
        type: createForm.type.trim(),
        value: createForm.value.trim(),
        description: createForm.description.trim(),
      });
      if (res.success && res.data) {
        setConfigs((prev) => [...prev, res.data!]);
        setSuccess(res.message || "Config created successfully.");
        setCreateForm({
          key: "",
          value: "true",
          type: "boolean",
          label: "",
          category: "feature_flags",
          description: "",
        });
        setShowCreate(false);
      } else {
        setError(res.message || "Failed to create config.");
      }
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Create failed. Check the API and try again.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ── Group by category ─────────────────────────────────────────────────────

  const grouped = CATEGORY_ORDER.reduce<Record<string, SystemConfig[]>>(
    (acc, cat) => {
      const items = configs.filter((c) => c.category === cat);
      if (items.length) acc[cat] = items;
      return acc;
    },
    {},
  );

  // Any categories not in CATEGORY_ORDER
  configs.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = [];
    if (!grouped[c.category].includes(c)) grouped[c.category].push(c);
  });

  const categoryKeys = Object.keys(grouped);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="System Configuration">
      <div className="px-4 md:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
              App controls
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              System Configuration
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Toggle feature flags, moderation rules, and notification settings.
              Changes apply immediately.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              New config
            </button>
            <button
              type="button"
              onClick={loadConfigs}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 disabled:opacity-60"
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

        {/* Notices */}
        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        {/* Create form */}
        {showCreate && (
          <section className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                Create config
              </h3>
              <p className="text-sm text-slate-400 font-['IBM_Plex_Mono',monospace]">
                POST /api/admin/system-config
              </p>
            </div>
            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 gap-4 lg:grid-cols-2"
            >
              <Field
                label="Key"
                value={createForm.key}
                placeholder="e.g. dark_mode_enabled"
                onChange={(v) => setCreateForm((f) => ({ ...f, key: v }))}
              />
              <Field
                label="Label"
                value={createForm.label}
                placeholder="e.g. Dark Mode"
                onChange={(v) => setCreateForm((f) => ({ ...f, label: v }))}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Category
                </label>
                <select
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, category: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors focus:border-amber-400"
                >
                  <option value="feature_flags">Feature Flags</option>
                  <option value="content">Content</option>
                  <option value="notifications">Notifications</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Type
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors focus:border-amber-400"
                >
                  <option value="boolean">Boolean</option>
                  <option value="string">String</option>
                  <option value="number">Number</option>
                </select>
              </div>
              <Field
                label="Value"
                value={createForm.value}
                placeholder="true"
                onChange={(v) => setCreateForm((f) => ({ ...f, value: v }))}
              />
              <Field
                label="Description (optional)"
                value={createForm.description}
                placeholder="What does this config do?"
                onChange={(v) =>
                  setCreateForm((f) => ({ ...f, description: v }))
                }
              />
              <div className="flex gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !createForm.key.trim() ||
                    !createForm.label.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Create config
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Update form — neutral slate highlight, distinct from the amber Create panel */}
        {editingConfig && (
          <section className="rounded-xl border border-slate-600 bg-slate-800/40 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                Update config
              </h3>
              <p className="text-sm text-slate-400 font-['IBM_Plex_Mono',monospace]">
                PUT /api/admin/system-config/{editingConfig.key}
              </p>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-300">Key</p>
                  <p className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 font-['IBM_Plex_Mono',monospace]">
                    {editingConfig.key}
                  </p>
                </div>
                <Field
                  label="Value"
                  value={editValue}
                  placeholder="Config value"
                  onChange={setEditValue}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Update config
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingConfig(null);
                    setEditValue("");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading configuration...
          </div>
        ) : categoryKeys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-12 text-center text-sm text-slate-400">
            No configuration entries found.
          </div>
        ) : (
          <div className="space-y-6">
            {categoryKeys.map((cat) => (
              <section key={cat}>
                {/* Category header */}
                <div className="mb-3 flex items-center gap-3">
                  <Settings className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 font-['IBM_Plex_Mono',monospace]">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </h3>
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
                    {grouped[cat].length}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {grouped[cat].map((config) => (
                    <ConfigCard
                      key={config._id}
                      config={config}
                      isToggling={togglingKey === config.key}
                      onToggle={handleToggle}
                      onEdit={startEditing}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ── ConfigCard ────────────────────────────────────────────────────────────────

function ConfigCard({
  config,
  isToggling,
  onToggle,
  onEdit,
}: {
  config: SystemConfig;
  isToggling: boolean;
  onToggle: (config: SystemConfig) => void;
  onEdit: (config: SystemConfig) => void;
}) {
  const isOn = config.value === "true";
  const isBoolean = config.type === "boolean";

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-xl border p-5 transition-colors ${
        isBoolean && isOn
          ? "border-emerald-500/20 bg-emerald-500/5"
          : isBoolean && !isOn
            ? "border-slate-800 bg-slate-900/40"
            : "border-slate-800 bg-slate-900/50"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white font-['Source_Serif_4',serif]">
            {config.label}
          </p>
          {isBoolean && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isOn
                  ? "bg-emerald-500/15 text-emerald-300"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {isOn ? "On" : "Off"}
            </span>
          )}
        </div>
        {config.description && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {config.description}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-600 font-['IBM_Plex_Mono',monospace]">
          {config.key}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isBoolean ? (
          <button
            type="button"
            onClick={() => onToggle(config)}
            disabled={isToggling}
            aria-label={`Toggle ${config.label}`}
            className="transition-opacity disabled:opacity-60"
          >
            {isToggling ? (
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            ) : isOn ? (
              <ToggleRight className="h-8 w-8 text-emerald-400" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-slate-500" />
            )}
          </button>
        ) : (
          <span className="max-w-40 truncate rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-sm text-slate-200 font-['IBM_Plex_Mono',monospace]">
            {config.value}
          </span>
        )}
        <button
          type="button"
          onClick={() => onEdit(config)}
          aria-label={`Edit ${config.label}`}
          className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-400 transition-colors hover:border-amber-400 hover:text-amber-300"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
      />
    </label>
  );
}

// ── Notice ────────────────────────────────────────────────────────────────────

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
