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
import { booksApi, type BibleplusBook } from "@/lib/api";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";

type BookForm = {
  title: string;
  author: string;
  description: string;
  category: string;
  audience: string;
};

const emptyForm: BookForm = {
  title: "",
  author: "",
  description: "",
  category: "general",
  audience: "adults",
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

export default function BooksPage() {
  const [books, setBooks] = useState<BibleplusBook[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<BookForm>(emptyForm);
  const [editForm, setEditForm] = useState<BookForm>(emptyForm);
  const [cover, setCover] = useState<File | null>(null);
  const [editCover, setEditCover] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDeletePending, setIsDeletePending] = useState(false);

  const selectedBook = useMemo(
    () => books.find((book) => book._id === selectedId) || null,
    [books, selectedId],
  );

  const filteredBooks = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return books;

    return books.filter((book) =>
      [book.title, book.author, book.category, book.audience]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle)),
    );
  }, [books, query]);

  const loadBooks = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await booksApi.getAll();
      const nextBooks = response.data || [];
      setBooks(nextBooks);
      setSelectedId((current) => current || nextBooks[0]?._id || "");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load books. Confirm GET /books and the admin token.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    if (!selectedBook) {
      setEditForm(emptyForm);
      setEditCover(null);
      setIsDeletePending(false);
      return;
    }

    setEditForm({
      title: selectedBook.title || "",
      author: selectedBook.author || "",
      description: selectedBook.description || "",
      category: selectedBook.category || "general",
      audience: selectedBook.audience || "adults",
    });
    setEditCover(null);
    setIsDeletePending(false);
  }, [selectedBook]);

  const buildBookFormData = (values: BookForm, nextCover: File | null) => {
    const data = new FormData();
    data.append("title", values.title.trim());
    data.append("author", values.author.trim());
    data.append("description", values.description.trim());
    data.append("category", values.category.trim() || "general");
    data.append("audience", values.audience.trim() || "adults");
    if (nextCover) data.append("cover", nextCover);
    return data;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.author.trim()) {
      setError("Title and author are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    const data = buildBookFormData(form, cover);

    try {
      const response = await booksApi.create(data);
      if (response.data) {
        setBooks((current) => [response.data as BibleplusBook, ...current]);
        setSelectedId(response.data._id);
      } else {
        await loadBooks();
      }
      setForm(emptyForm);
      setCover(null);
      setSuccess(response.message || "Book created successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Book creation failed. Confirm POST /admin/books and form-data fields title, author, and cover.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBook) return;

    if (!editForm.title.trim() || !editForm.author.trim()) {
      setError("Title and author are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await booksApi.update(
        selectedBook._id,
        buildBookFormData(editForm, editCover),
      );
      if (response.data) {
        setBooks((current) =>
          current.map((book) =>
            book._id === selectedBook._id
              ? (response.data as BibleplusBook)
              : book,
          ),
        );
      } else {
        await loadBooks();
      }
      setEditCover(null);
      setSuccess(response.message || "Book updated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Book update failed. Confirm PUT /admin/books/:id and the form-data fields.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBook) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await booksApi.delete(selectedBook._id);
      setBooks((current) =>
        current.filter((book) => book._id !== selectedBook._id),
      );
      setSelectedId("");
      setIsDeletePending(false);
      setSuccess(response.message || "Book deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Book delete failed. Confirm DELETE /admin/books/:id and the selected book ID.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Books">
      <div className="space-y-6 px-4 md:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
              The Catalog
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-white font-['Source_Serif_4',serif]">
              Manage books
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              List published books and add new admin-created titles.
            </p>
          </div>

          <div className="flex w-full gap-2 xl:w-[440px]">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search books"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>
            <button
              type="button"
              onClick={loadBooks}
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                  Books
                </h3>
                <p className="text-sm text-slate-400">
                  {filteredBooks.length} of {books.length} records shown
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-400 font-['IBM_Plex_Mono',monospace]">
                <BookOpen className="h-3.5 w-3.5" />
                {filteredBooks.length} books
              </span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[420px] items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading books...
              </div>
            ) : filteredBooks.length ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredBooks.map((book) => {
                  const isSelected = selectedId === book._id;
                  return (
                    <button
                      key={book._id}
                      type="button"
                      onClick={() => setSelectedId(book._id)}
                      className={`relative overflow-hidden rounded-xl border bg-slate-950/60 text-left transition-colors ${
                        isSelected
                          ? "border-amber-400/60 bg-amber-400/5"
                          : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {isSelected && (
                        <span
                          aria-hidden
                          className="absolute left-0 top-0 z-10 h-9 w-2.5 bg-amber-400"
                          style={{
                            clipPath:
                              "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)",
                          }}
                        />
                      )}
                      <div className="flex gap-4 p-4">
                        <BookCover book={book} />
                        <div className="min-w-0 flex-1">
                          <h4 className="line-clamp-2 text-sm font-semibold text-white font-['Source_Serif_4',serif]">
                            {book.title || "Untitled book"}
                          </h4>
                          <p className="mt-1 text-sm text-slate-400">
                            {book.author || "Unknown author"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <Tag>{book.category || "general"}</Tag>
                            <Tag>{book.audience || "adults"}</Tag>
                          </div>
                          <p className="mt-3 text-[11px] text-slate-500 font-['IBM_Plex_Mono',monospace]">
                            {book.totalChapters || 0} ch ·{" "}
                            {formatDate(book.publishedAt || book.createdAt)}
                          </p>
                        </div>
                      </div>
                      {book.description && (
                        <p className="border-t border-slate-800 px-4 py-3 text-sm text-slate-400">
                          {book.description}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
                No books found.
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
                Ledger
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                Create book
              </h3>
              <p className="text-sm text-slate-400">
                Sends form-data to POST /admin/books.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <TextField
                label="Title"
                value={form.title}
                onChange={(value) =>
                  setForm((current) => ({ ...current, title: value }))
                }
              />
              <TextField
                label="Author"
                value={form.author}
                onChange={(value) =>
                  setForm((current) => ({ ...current, author: value }))
                }
              />
              <TextField
                label="Category"
                value={form.category}
                onChange={(value) =>
                  setForm((current) => ({ ...current, category: value }))
                }
              />
              <TextField
                label="Audience"
                value={form.audience}
                onChange={(value) =>
                  setForm((current) => ({ ...current, audience: value }))
                }
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </span>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Cover image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setCover(event.target.files?.[0] || null)
                  }
                  className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                />
                {cover && (
                  <p className="mt-2 text-xs text-slate-400">
                    Selected: {cover.name}
                  </p>
                )}
              </label>

              <button
                type="submit"
                disabled={isSaving || !form.title.trim() || !form.author.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Create book
              </button>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-5">
              <div className="mb-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-400 font-['IBM_Plex_Mono',monospace]">
                  Ledger
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white font-['Source_Serif_4',serif]">
                  Selected book
                </h3>
                <p className="text-sm text-slate-400 font-['IBM_Plex_Mono',monospace]">
                  {selectedBook
                    ? selectedBook._id
                    : "Choose a book to edit or delete."}
                </p>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <TextField
                  label="Title"
                  value={editForm.title}
                  disabled={!selectedBook}
                  onChange={(value) =>
                    setEditForm((current) => ({ ...current, title: value }))
                  }
                />
                <TextField
                  label="Author"
                  value={editForm.author}
                  disabled={!selectedBook}
                  onChange={(value) =>
                    setEditForm((current) => ({ ...current, author: value }))
                  }
                />
                <TextField
                  label="Category"
                  value={editForm.category}
                  disabled={!selectedBook}
                  onChange={(value) =>
                    setEditForm((current) => ({ ...current, category: value }))
                  }
                />
                <TextField
                  label="Audience"
                  value={editForm.audience}
                  disabled={!selectedBook}
                  onChange={(value) =>
                    setEditForm((current) => ({ ...current, audience: value }))
                  }
                />

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Description
                  </span>
                  <textarea
                    value={editForm.description}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    disabled={!selectedBook}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400 disabled:opacity-60"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">
                    Replace cover image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!selectedBook}
                    onChange={(event) =>
                      setEditCover(event.target.files?.[0] || null)
                    }
                    className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700 disabled:opacity-60"
                  />
                  {editCover && (
                    <p className="mt-2 text-xs text-slate-400">
                      Selected: {editCover.name}
                    </p>
                  )}
                </label>

                <button
                  type="submit"
                  disabled={
                    isSaving ||
                    !selectedBook ||
                    !editForm.title.trim() ||
                    !editForm.author.trim()
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Update book
                </button>
              </form>

              <button
                type="button"
                onClick={() => setIsDeletePending(true)}
                disabled={!selectedBook || isSaving}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete book
              </button>

              {isDeletePending && selectedBook && (
                <div className="mt-3">
                  <ConfirmAction
                    message={`Delete "${selectedBook.title || selectedBook._id}"? This cannot be undone.`}
                    confirmLabel="Delete book"
                    disabled={isSaving}
                    onConfirm={handleDelete}
                    onCancel={() => setIsDeletePending(false)}
                  />
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function BookCover({ book }: { book: BibleplusBook }) {
  if (book.coverImage) {
    return (
      <img
        src={book.coverImage}
        alt=""
        className="h-24 w-16 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <div className="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-slate-500">
      <ImageIcon className="h-6 w-6" />
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

function TextField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400 disabled:opacity-60"
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
