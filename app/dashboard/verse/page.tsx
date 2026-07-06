"use client";

import { FormEvent, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { verseApi, type VerseOfDay, type VerseOfDayPayload } from "@/lib/api";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";

const sampleVerse: VerseOfDayPayload = {
  date: "2024-01-01",
  reference: "John 3:16",
  book: "John",
  chapter: 3,
  verse: 16,
  text: "For God so loved the world...",
  translation: "KJV",
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

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function VerseOfDayPage() {
  const [form, setForm] = useState<VerseOfDayPayload>({
    ...sampleVerse,
    date: today(),
  });
  const [savedVerse, setSavedVerse] = useState<VerseOfDay | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canSubmit = Boolean(
    form.date.trim() &&
      form.reference.trim() &&
      form.book.trim() &&
      form.chapter > 0 &&
      form.verse > 0 &&
      form.text.trim() &&
      form.translation.trim(),
  );

  const preview = useMemo(
    () => ({
      ...form,
      chapter: Number(form.chapter) || 0,
      verse: Number(form.verse) || 0,
    }),
    [form],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      setError("Date, reference, book, chapter, verse, text, and translation are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: VerseOfDayPayload = {
        date: form.date.trim(),
        reference: form.reference.trim(),
        book: form.book.trim(),
        chapter: Number(form.chapter),
        verse: Number(form.verse),
        text: form.text.trim(),
        translation: form.translation.trim(),
      };
      const response = await verseApi.setVerseOfDay(payload);
      setSavedVerse(response.data || null);
      setSuccess(response.message || "Verse of the day set successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not set verse of the day. Confirm POST /admin/verse/set and the JSON body.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Verse of the Day">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">Daily verse</p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              Set verse of the day
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Choose the date and scripture details to lock in the BiblePlus
              verse of the day.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(sampleVerse);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            Load sample
          </button>
        </div>

        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"
        >
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                  Verse details
                </h3>
                <p className="text-sm text-slate-400">
                  Sends JSON to POST /api/admin/verse/set.
                </p>
              </div>
              <button
                type="submit"
                disabled={isSaving || !canSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 font-['Source_Serif_4',serif] transition-colors hover:bg-amber-300 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Set verse
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <TextField
                icon={CalendarDays}
                label="Date"
                type="date"
                value={form.date}
                onChange={(value) =>
                  setForm((current) => ({ ...current, date: value }))
                }
              />
              <TextField
                icon={BookOpen}
                label="Reference"
                value={form.reference}
                placeholder="John 3:16"
                onChange={(value) =>
                  setForm((current) => ({ ...current, reference: value }))
                }
              />
              <TextField
                icon={BookOpen}
                label="Book"
                value={form.book}
                placeholder="John"
                onChange={(value) =>
                  setForm((current) => ({ ...current, book: value }))
                }
              />
              <TextField
                icon={Hash}
                label="Chapter"
                type="number"
                min={1}
                value={String(form.chapter)}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    chapter: Number(value),
                  }))
                }
              />
              <TextField
                icon={Hash}
                label="Verse"
                type="number"
                min={1}
                value={String(form.verse)}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    verse: Number(value),
                  }))
                }
              />
              <TextField
                icon={FileText}
                label="Translation"
                value={form.translation}
                placeholder="KJV"
                onChange={(value) =>
                  setForm((current) => ({ ...current, translation: value }))
                }
              />
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Verse text
                </span>
                <textarea
                  value={form.text}
                  placeholder="For God so loved the world..."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                  rows={6}
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
                />
              </label>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">Preview</h3>
                <p className="text-sm text-slate-400">
                  This is the payload that will be saved.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  {preview.date}
                </p>
                <blockquote className="mt-4 text-lg font-semibold leading-7 text-white">
                  "{preview.text || "Verse text"}"
                </blockquote>
                <p className="mt-4 text-sm font-semibold text-slate-300">
                  {preview.reference || "Reference"} -{" "}
                  {preview.translation || "Translation"}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {preview.book || "Book"} {preview.chapter}:{preview.verse}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                Last saved response
              </h3>
              {savedVerse ? (
                <div className="mt-4 rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
                  <p className="break-all text-xs text-slate-500">
                    ID: {savedVerse._id}
                  </p>
                  <p className="mt-3 font-semibold text-white">
                    {savedVerse.reference}
                  </p>
                  <p className="mt-2 text-slate-400">{savedVerse.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Tag>{savedVerse.source || "admin"}</Tag>
                    <Tag>{savedVerse.locked ? "locked" : "unlocked"}</Tag>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                  The saved verse response will appear here.
                </div>
              )}
            </section>
          </aside>
        </form>
      </div>
    </DashboardLayout>
  );
}

function TextField({
  icon: Icon,
  label,
  type = "text",
  min,
  value,
  placeholder,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type?: string;
  min?: number;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type={type}
          min={min}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
        />
      </div>
    </label>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-slate-800 px-2 py-1 font-semibold text-slate-300">
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
