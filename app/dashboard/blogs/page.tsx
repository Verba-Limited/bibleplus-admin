"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ConfirmAction } from "@/components/confirm-action";
import { DashboardLayout } from "@/components/dashboard-layout";
import { blogsApi, type BibleplusBlog } from "@/lib/api";
import {
  CheckCircle2,
  FileText,
  ImageIcon,
  Loader2,
  Megaphone,
  Pencil,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
} from "lucide-react";

const ADMIN_BLOGS_STORAGE_KEY = "bibleplus-admin-local-blogs";

function toBlogList(value: unknown): BibleplusBlog[] {
  if (Array.isArray(value)) return value as BibleplusBlog[];
  if (value && typeof value === "object") {
    const data = value as {
      blogs?: BibleplusBlog[];
      results?: BibleplusBlog[];
      posts?: BibleplusBlog[];
    };
    return data.blogs || data.results || data.posts || [];
  }
  return [];
}

function mergeBlogs(...blogGroups: BibleplusBlog[][]) {
  const merged = new Map<string, BibleplusBlog>();

  blogGroups.flat().forEach((blog) => {
    if (blog?._id) {
      merged.set(blog._id, { ...merged.get(blog._id), ...blog });
    }
  });

  return Array.from(merged.values());
}

function loadStoredBlogs() {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(ADMIN_BLOGS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as BibleplusBlog[]) : [];
  } catch {
    return [];
  }
}

function storeBlogs(blogs: BibleplusBlog[]) {
  localStorage.setItem(ADMIN_BLOGS_STORAGE_KEY, JSON.stringify(blogs));
}

function stripHtml(value?: string) {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function blogIsPublished(blog?: BibleplusBlog | null) {
  return Boolean(
    blog?.published || blog?.isPublished || blog?.status === "published",
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

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BibleplusBlog[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [commentId, setCommentId] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    coverImage: null as File | null,
  });

  const selectedBlog = useMemo(
    () => blogs.find((blog) => blog._id === selectedId) || null,
    [blogs, selectedId],
  );
  const targetBlogId = selectedId.trim();

  const filteredBlogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return blogs;

    return blogs.filter((blog) =>
      [blog.title, blog.slug, stripHtml(blog.content)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [blogs, searchQuery]);

  const stats = useMemo(
    () => ({
      total: blogs.length,
      published: blogs.filter(blogIsPublished).length,
      drafts: blogs.filter((blog) => !blogIsPublished(blog)).length,
    }),
    [blogs],
  );

  const loadBlogs = async () => {
    setIsLoading(true);
    setError("");
    const storedBlogs = loadStoredBlogs();

    try {
      const response = await blogsApi.getAll();
      const nextBlogs = mergeBlogs(storedBlogs, toBlogList(response.data));
      setBlogs(nextBlogs);
      setSelectedId((current) => current || nextBlogs[0]?._id || "");
    } catch (err) {
      console.error(err);
      setBlogs(storedBlogs);
      setSelectedId((current) => current || storedBlogs[0]?._id || "");
      setError(
        "Could not load the optional public blog list. Showing locally saved admin drafts.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  useEffect(() => {
    if (!selectedBlog) return;
    setIsDeletePending(false);

    setForm((current) => ({
      ...current,
      title: selectedBlog.title || "",
      content: selectedBlog.content || "",
      coverImage: null,
    }));
  }, [selectedBlog]);

  const buildFormData = () => {
    const data = new FormData();
    data.append("title", form.title);
    data.append("content", form.content);
    if (form.coverImage) {
      data.append("coverImage", form.coverImage);
    }
    return data;
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await blogsApi.create(buildFormData());
      setSuccess(response.message || "Blog created successfully.");
      if (response.data?._id) {
        setSelectedId(response.data._id);
        setBlogs((current) => {
          const nextBlogs = mergeBlogs(
            [response.data as BibleplusBlog],
            current,
          );
          storeBlogs(nextBlogs);
          return nextBlogs;
        });
      }
      setForm({ title: "", content: "", coverImage: null });
    } catch (err) {
      console.error(err);
      setError(
        "Blog creation failed. Make sure title, content, and cover image match the backend fields.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!targetBlogId) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await blogsApi.update(targetBlogId, buildFormData());
      setSuccess(response.message || "Blog updated successfully.");
      if (response.data?._id) {
        setBlogs((current) => {
          const nextBlogs = mergeBlogs(
            [response.data as BibleplusBlog],
            current,
          );
          storeBlogs(nextBlogs);
          return nextBlogs;
        });
      }
    } catch (err) {
      console.error(err);
      setError(
        "Blog update failed. Confirm the update endpoint accepts form-data.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!targetBlogId) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await blogsApi.publish(targetBlogId);
      setSuccess(response.message || "Blog published successfully.");
      setBlogs((current) => {
        const nextBlogs = current.map((blog) =>
          blog._id === targetBlogId
            ? { ...blog, ...(response.data || {}), status: "published" }
            : blog,
        );
        storeBlogs(nextBlogs);
        return nextBlogs;
      });
    } catch (err) {
      console.error(err);
      setError(
        "Publish failed. Confirm the publish route uses PUT /admin/blogs/:id/publish.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!targetBlogId) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await blogsApi.delete(targetBlogId);
      setSuccess(response.message || "Blog deleted successfully.");
      setSelectedId("");
      setIsDeletePending(false);
      setBlogs((current) => {
        const nextBlogs = current.filter((blog) => blog._id !== targetBlogId);
        storeBlogs(nextBlogs);
        return nextBlogs;
      });
    } catch (err) {
      console.error(err);
      setError("Blog delete failed. Confirm the selected blog id is valid.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefreshExternal = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await blogsApi.refreshExternal();
      setSuccess(response.message || "External blogs refreshed.");
    } catch (err) {
      console.error(err);
      setError(
        "Refresh external blogs failed. The route may use a different path.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentId.trim()) return;
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await blogsApi.deleteComment(commentId.trim());
      setSuccess(response.message || "Comment deleted successfully.");
      setCommentId("");
    } catch (err) {
      console.error(err);
      setError(
        "Comment delete failed. Send me that endpoint path if it differs.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Blogs">
      <div className="px-4 md:px-6 space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">Blog operations</p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Create, publish, and manage blogs
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Manage editorial posts with form-data uploads, ID-based publishing
              controls, refresh tools, and safe delete actions.
            </p>
          </div>
          <div className="grid grid-rows-2 md:grid-rows-1 sm:grid-rows-2 gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRefreshExternal}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${isSaving ? "animate-spin" : ""}`}
              />
              Refresh Background
            </button>
            <button
              type="button"
              onClick={loadBlogs}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh blog library
            </button>
          </div>
        </div>

        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Total blogs" value={stats.total} icon={FileText} />
          <StatCard
            label="Published"
            value={stats.published}
            icon={Megaphone}
          />
          <StatCard
            label="Drafts / pending"
            value={stats.drafts}
            icon={Pencil}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.95fr)]">
          <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Blog library
                </h3>
                <p className="text-sm text-slate-400">
                  Public posts plus locally saved admin drafts from this
                  browser.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search blogs"
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex min-h-[380px] items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading blogs...
              </div>
            ) : filteredBlogs.length ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredBlogs.map((blog) => (
                  <button
                    key={blog._id}
                    type="button"
                    onClick={() => setSelectedId(blog._id)}
                    className={`overflow-hidden rounded-xl border text-left transition-colors ${
                      selectedId === blog._id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                  >
                    <BlogImage blog={blog} />
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h4 className="line-clamp-2 text-sm font-semibold text-white">
                          {blog.title}
                        </h4>
                        <StatusBadge blog={blog} />
                      </div>
                      <p className="line-clamp-3 text-xs leading-5 text-slate-400">
                        {stripHtml(blog.content) ||
                          blog.slug ||
                          "No summary available."}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        {formatDate(blog.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyPanel message="No public posts or locally saved drafts yet. Create a draft here and it will stay visible on this browser." />
            )}
          </section>

          <aside className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">Blog editor</h3>
              <p className="text-sm text-slate-400">
                {selectedBlog
                  ? `Selected: ${selectedBlog._id}`
                  : "Create a new blog or paste an existing blog ID for actions."}
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Blog ID for update, publish, or delete
                </span>
                <input
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  placeholder="Paste blog id, e.g. 6a33e..."
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  Create does not need an ID. Update, publish, and delete use
                  this value.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Title
                </span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Book for New Moms..."
                  className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Content
                </span>
                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  placeholder="Write or paste the blog content..."
                  rows={8}
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm leading-6 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                />
              </label>

              <label className="block rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-4">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <Upload className="h-4 w-4" />
                  Cover image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      coverImage: event.target.files?.[0] || null,
                    }))
                  }
                  className="mt-3 block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                />
                <span className="mt-2 block text-xs text-slate-500">
                  {form.coverImage
                    ? form.coverImage.name
                    : "Uses form-data key: coverImage"}
                </span>
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={
                    isSaving || !form.title.trim() || !form.content.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Create blog
                </button>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSaving || !targetBlogId}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800 disabled:opacity-60"
                >
                  <Pencil className="h-4 w-4" />
                  Update selected
                </button>
              </div>
            </form>

            <div className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-800 pt-5 sm:grid-cols-2">
              <button
                type="button"
                onClick={handlePublish}
                disabled={isSaving || !targetBlogId}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition-colors hover:bg-emerald-500/15 disabled:opacity-60"
              >
                <Megaphone className="h-4 w-4" />
                Publish
              </button>
              <button
                type="button"
                onClick={() => setIsDeletePending(true)}
                disabled={isSaving || !targetBlogId}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>

            {isDeletePending && (
              <div className="mt-3">
                <ConfirmAction
                  message={`Delete "${selectedBlog?.title || targetBlogId}"? This cannot be undone.`}
                  confirmLabel="Delete blog"
                  disabled={isSaving}
                  onConfirm={handleDelete}
                  onCancel={() => setIsDeletePending(false)}
                />
              </div>
            )}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function BlogImage({ blog }: { blog: BibleplusBlog }) {
  const src = blog.coverImage || blog.image;

  if (!src || typeof src !== "string") {
    return (
      <div className="flex aspect-[16/9] items-center justify-center bg-slate-900 text-slate-600">
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] bg-slate-900">
      <Image
        src={src}
        alt={blog.title}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 360px, 100vw"
        unoptimized
      />
    </div>
  );
}

function StatusBadge({ blog }: { blog: BibleplusBlog }) {
  const published = blogIsPublished(blog);

  return (
    <span
      className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
        published
          ? "bg-emerald-500/10 text-emerald-300"
          : "bg-amber-500/10 text-amber-300"
      }`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
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
        <Trash2 className="h-4 w-4" />
      ) : (
        <CheckCircle2 className="h-4 w-4" />
      )}
      {message}
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}
