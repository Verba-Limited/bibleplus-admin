"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ConfirmAction } from "@/components/confirm-action";
import { DashboardLayout } from "@/components/dashboard-layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { eventsApi, type BibleplusEvent, type EventPayload } from "@/lib/api";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  Send,
  Trash2,
  Upload,
} from "lucide-react";

type EventView = "all" | "upcoming" | "past" | "search";

const views: { id: EventView; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "search", label: "Search" },
];

function toEventList(value: unknown): BibleplusEvent[] {
  if (Array.isArray(value)) return value as BibleplusEvent[];
  if (value && typeof value === "object") {
    const data = value as {
      events?: BibleplusEvent[];
      results?: BibleplusEvent[];
    };
    return data.events || data.results || [];
  }
  return [];
}

function getEventTitle(event: BibleplusEvent) {
  return event.title || event.name || "Untitled event";
}

function getEventDate(event: BibleplusEvent) {
  return event.date || event.startDate || event.createdAt || "";
}

function getLiveStreamUrl(event: BibleplusEvent) {
  return (
    event.liveStream?.url ||
    event.livestreamUrl ||
    (typeof event.livestream === "string" ? event.livestream : "") ||
    ""
  );
}

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

function toDateTimeLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  if (!value) return "";
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const date = new Date(dateOnlyPattern.test(value) ? `${value}T00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export default function EventsPage() {
  const [activeView, setActiveView] = useState<EventView>("all");
  const [events, setEvents] = useState<BibleplusEvent[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerUrl, setBannerUrl] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [speakerForm, setSpeakerForm] = useState({
    name: "",
    bio: "",
  });
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: "",
    coverImage: "",
    category: "",
    frequency: "",
    isOnline: false,
    liveStreamPlatform: "",
    liveStreamUrl: "",
    liveStreamThumbnail: "",
  });
  const [form, setForm] = useState({
    title: "",
    startDate: "",
    endDate: "",
    location: "",
    status: "",
    description: "",
    liveStreamPlatform: "",
    liveStreamUrl: "",
    liveStreamThumbnail: "",
  });

  const selectedEvent = useMemo(
    () => events.find((event) => event._id === selectedId) || null,
    [events, selectedId],
  );
  const canCreateEvent = Boolean(
    createForm.title.trim() &&
    createForm.description.trim() &&
    createForm.startDate.trim() &&
    createForm.endDate.trim(),
  );

  const loadEvents = async (view = activeView) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response =
        view === "upcoming"
          ? await eventsApi.getUpcoming()
          : view === "past"
            ? await eventsApi.getPast()
            : view === "search" && searchQuery.trim()
              ? await eventsApi.search(searchQuery.trim())
              : await eventsApi.getAll();

      const nextEvents = toEventList(response.data);
      setEvents(nextEvents);
      setSelectedId((current) => current || nextEvents[0]?._id || "");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Could not load events. Confirm the endpoint path and admin token.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents("all");
  }, []);

  // useEffect(() => {
  //   if (!selectedEvent) return;

  //   setForm({
  //     title: getEventTitle(selectedEvent),
  //     startDate: selectedEvent.startDate || getEventDate(selectedEvent),
  //     endDate: selectedEvent.endDate || "",
  //     location: selectedEvent.location || "",
  //     status: selectedEvent.status || "",
  //     description: selectedEvent.description || "",
  //     liveStreamPlatform: selectedEvent.liveStream?.platform || "",
  //     liveStreamUrl: getLiveStreamUrl(selectedEvent),
  //     liveStreamThumbnail: selectedEvent.liveStream?.thumbnail || "",
  //   });
  // }, [selectedEvent]);

  useEffect(() => {
    if (!selectedEvent) return;
    setIsDeletePending(false);

    setForm({
      title: getEventTitle(selectedEvent),
      startDate: toDateTimeLocal(
        selectedEvent.startDate || getEventDate(selectedEvent),
      ),
      endDate: toDateTimeLocal(selectedEvent.endDate || ""),
      location: selectedEvent.location || "",
      status: selectedEvent.status || "",
      description: selectedEvent.description || "",
      liveStreamPlatform: selectedEvent.liveStream?.platform || "",
      liveStreamUrl: getLiveStreamUrl(selectedEvent),
      liveStreamThumbnail: selectedEvent.liveStream?.thumbnail || "",
    });
  }, [selectedEvent]);

  const buildEventPayload = (values: typeof createForm): EventPayload => ({
    title: values.title,
    description: values.description,
    startDate: fromDateTimeLocal(values.startDate),
    endDate: fromDateTimeLocal(values.endDate),
    location: values.location,
    coverImage: values.coverImage || bannerUrl,
    category: values.category,
    frequency: values.frequency,
    isOnline: values.isOnline || Boolean(values.liveStreamUrl),
    liveStream: {
      platform: values.liveStreamPlatform,
      url: values.liveStreamUrl,
      thumbnail: values.liveStreamThumbnail,
    },
  });

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const coverImage = createForm.coverImage || bannerUrl;

    if (bannerFile && !coverImage) {
      setError("Upload the selected banner first, then create the event.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildEventPayload({ ...createForm, coverImage });
      const response = await eventsApi.create(payload);
      if (response.data?._id) {
        setEvents((current) => [response.data as BibleplusEvent, ...current]);
        setSelectedId(response.data._id);
      }
      if (!response.data?.coverImage && coverImage) {
        setError(
          "Event was created, but the backend returned an empty coverImage. The create event endpoint may not be saving coverImage yet.",
        );
      }
      setSuccess(response.message || "Event created successfully.");
      setCreateForm({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        coverImage: "",
        category: "",
        isOnline: false,
        frequency: "",
        liveStreamPlatform: "",
        liveStreamUrl: "",
        liveStreamThumbnail: "",
      });
    } catch (err) {
      console.error(err);
      setError(
        "Event creation failed. Confirm POST /admin/events and the payload shape.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerFile) return;

    setIsUploadingBanner(true);
    setError("");
    setSuccess("");

    try {
      const response = await eventsApi.uploadBanner(bannerFile);
      setBannerUrl(response.url);
      setCreateForm((current) => ({ ...current, coverImage: response.url }));
      setSuccess("Banner uploaded and added to the Cover image URL field.");
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Banner upload failed. Please choose an image and try again.",
        ),
      );
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleUploadGallery = async () => {
    if (!galleryFiles?.length) return;

    setIsUploadingBanner(true);
    setError("");
    setSuccess("");

    try {
      const response = await eventsApi.uploadGallery(galleryFiles);
      const urls = response.images.map((image) => image.url);
      setGalleryUrls(urls);
      setSuccess(
        `${urls.length} gallery image${urls.length === 1 ? "" : "s"} uploaded successfully.`,
      );
    } catch (err) {
      console.error(err);
      setError(
        getRequestErrorMessage(
          err,
          "Gallery upload failed. Please choose one or more images and try again.",
        ),
      );
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleCreateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim()) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await eventsApi.createCategory(categoryName.trim());
      setCreateForm((current) => ({
        ...current,
        category: response.data?.name || categoryName.trim(),
      }));
      setSuccess(
        response.data?._id
          ? `Category "${response.data.name}" created.`
          : response.message || "Category created successfully.",
      );
      setCategoryName("");
    } catch (err) {
      console.error(err);
      setError(
        "Category creation failed. Confirm POST /admin/event-categories.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSpeaker = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!speakerForm.name.trim()) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await eventsApi.createSpeaker({
        name: speakerForm.name.trim(),
        bio: speakerForm.bio.trim(),
      });
      setSuccess(
        response.data?._id
          ? `Speaker "${response.data.name}" created.`
          : response.message || "Speaker created successfully.",
      );
      setSpeakerForm({ name: "", bio: "" });
    } catch (err) {
      console.error(err);
      setError("Speaker creation failed. Confirm POST /admin/speakers.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewChange = (view: EventView) => {
    setActiveView(view);
    if (view !== "search") {
      loadEvents(view);
    }
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveView("search");
    loadEvents("search");
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedId) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        title: form.title,
        startDate: fromDateTimeLocal(form.startDate),
        endDate: fromDateTimeLocal(form.endDate),
        location: form.location,
        status: form.status,
        description: form.description,
        liveStream: {
          platform: form.liveStreamPlatform,
          url: form.liveStreamUrl,
          thumbnail: form.liveStreamThumbnail,
        },
      };
      await eventsApi.update(selectedId, payload);
      setSuccess("Event details updated.");
      await loadEvents(activeView);
    } catch (err) {
      console.error(err);
      setError(
        "Event update failed. The backend may expect different field names.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLivestreamUpdate = async () => {
    if (!selectedId) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await eventsApi.updateLivestream(selectedId, {
        platform: form.liveStreamPlatform,
        url: form.liveStreamUrl,
        thumbnail: form.liveStreamThumbnail,
      });
      if (response.data?._id) {
        setEvents((current) =>
          current.map((event) =>
            event._id === response.data?._id
              ? (response.data as BibleplusEvent)
              : event,
          ),
        );
      }
      setSuccess(response.message || "Livestream updated successfully.");
    } catch (err) {
      console.error(err);
      setError(
        "Livestream update failed. Confirm PUT /admin/events/:id/live and the selected event ID.",
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
      const response = await eventsApi.delete(selectedId);
      setEvents((current) =>
        current.filter((event) => event._id !== selectedId),
      );
      setSelectedId("");
      setIsDeletePending(false);
      setSuccess(response.message || "Event deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(
        "Event delete failed. Confirm DELETE /admin/events/:id and the selected event ID.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout title="Events">
      <div className="px-4 md:px-6 space-y-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-300">
              Event operations
            </p>
            <h2 className="mt-1 text-2xl font-bold text-white">
              Manage BiblePlus events
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Review event lists, find upcoming or past events, patch event
              details, and update livestream links.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="flex w-full gap-2 xl:w-[420px]"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search events"
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
              />
            </div>
            <button className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-500">
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {views.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => handleViewChange(view.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeView === view.id
                  ? "bg-blue-600 text-white"
                  : "border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
              }`}
            >
              {view.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => loadEvents(activeView)}
            disabled={isLoading}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-700 disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        {error && <Notice tone="error" message={error} />}
        {success && <Notice tone="success" message={success} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Upload banner
              </h3>
              {/* <p className="text-sm text-slate-400">
                POST /api/admin/events/upload-banner with form-data key banner.
              </p> */}
            </div>
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/60 p-4">
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setBannerFile(event.target.files?.[0] || null)
                }
                className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
              />
              <button
                type="button"
                onClick={handleUploadBanner}
                disabled={!bannerFile || isUploadingBanner}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {isUploadingBanner ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload banner
              </button>
              {bannerUrl && (
                <div className="mt-4 rounded-lg bg-slate-950 p-3">
                  <p className="text-xs text-slate-500">Uploaded URL</p>
                  <p className="mt-1 break-all text-sm font-medium text-slate-200">
                    {bannerUrl}
                  </p>
                  <p className="mt-2 text-xs text-emerald-300">
                    This URL is now applied to the Create Event coverImage
                    field.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Create event category
              </h3>
              <p className="text-sm text-slate-400">
                POST /api/admin/event-categories with JSON name.
              </p>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <TextField
                label="Category name"
                value={categoryName}
                placeholder="Conference"
                onChange={setCategoryName}
              />
              <button
                type="submit"
                disabled={isSaving || !categoryName.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Create category
              </button>
            </form>
          </section> */}

          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Create speaker
              </h3>
              {/* <p className="text-sm text-slate-400">
                POST /api/admin/speakers with JSON name and bio.
              </p> */}
            </div>
            <form onSubmit={handleCreateSpeaker} className="space-y-4">
              <TextField
                label="Speaker name"
                value={speakerForm.name}
                placeholder="John Henry"
                onChange={(value) =>
                  setSpeakerForm((current) => ({ ...current, name: value }))
                }
              />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Bio
                </span>
                <textarea
                  value={speakerForm.bio}
                  onChange={(event) =>
                    setSpeakerForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Speaker Bio"
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
                />
              </label>
              <button
                type="submit"
                disabled={isSaving || !speakerForm.name.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Create speaker
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-white">Create event</h3>
            {/* <p className="text-sm text-slate-400">
              POST /api/admin/events. Add livestream URL inside liveStream.url.
            </p> */}
          </div>

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 gap-4 lg:grid-cols-2"
          >
            <TextField
              label="Title"
              value={createForm.title}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, title: value }))
              }
            />
            <TextField
              label="Location"
              value={createForm.location}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, location: value }))
              }
            />
            <TextField
              label="Category"
              value={createForm.category}
              placeholder="general"
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, category: value }))
              }
            />
            <TextField
              label="Cover image URL"
              value={createForm.coverImage}
              placeholder="/uploads/events/banners/..."
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, coverImage: value }))
              }
            />
            <DateField
              label="Start date"
              value={createForm.startDate}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, startDate: value }))
              }
            />
            <DateField
              label="End date"
              value={createForm.endDate}
              onChange={(value) =>
                setCreateForm((current) => ({ ...current, endDate: value }))
              }
            />
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Frequency
              </span>
              <select
                value={createForm.frequency}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    frequency: event.target.value,
                  }))
                }
                className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors focus:border-blue-500"
              >
                <option value="Once">Once</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </label>
            <label className="block lg:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-300">
                Description
              </span>
              <textarea
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500"
              />
            </label>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Livestream</p>
                  <p className="text-xs text-slate-400">
                    These become liveStream.platform, liveStream.url, and
                    liveStream.thumbnail.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={createForm.isOnline}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        isOnline: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                  />
                  Online event
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <TextField
                  label="Platform"
                  value={createForm.liveStreamPlatform}
                  placeholder="YouTube"
                  onChange={(value) =>
                    setCreateForm((current) => ({
                      ...current,
                      liveStreamPlatform: value,
                    }))
                  }
                />
                <TextField
                  label="URL"
                  value={createForm.liveStreamUrl}
                  placeholder="https://youtube.com/live/..."
                  onChange={(value) =>
                    setCreateForm((current) => ({
                      ...current,
                      liveStreamUrl: value,
                    }))
                  }
                />
                <TextField
                  label="Thumbnail"
                  value={createForm.liveStreamThumbnail}
                  placeholder="https://..."
                  onChange={(value) =>
                    setCreateForm((current) => ({
                      ...current,
                      liveStreamThumbnail: value,
                    }))
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || !canCreateEvent}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60 lg:col-span-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Create event
            </button>
          </form>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_420px]">
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Events</h3>
                <p className="text-sm text-slate-400">
                  {events.length} records loaded
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold capitalize text-slate-300">
                {activeView}
              </span>
            </div>

            {isLoading ? (
              <div className="flex min-h-[360px] items-center justify-center text-slate-400">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading events...
              </div>
            ) : events.length ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {events.map((event) => (
                  <button
                    key={event._id}
                    type="button"
                    onClick={() => setSelectedId(event._id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selectedId === event._id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h4 className="line-clamp-2 text-sm font-semibold text-white">
                        {getEventTitle(event)}
                      </h4>
                      <span className="shrink-0 rounded-full bg-slate-800 px-2 py-1 text-xs font-semibold capitalize text-slate-300">
                        {event.status || (event.isLive ? "live" : "event")}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-400">
                      <EventMeta
                        icon={CalendarDays}
                        text={formatDate(getEventDate(event))}
                      />
                      <EventMeta
                        icon={MapPin}
                        text={event.location || "No location"}
                      />
                      <EventMeta
                        icon={Radio}
                        text={getLiveStreamUrl(event) || "No livestream link"}
                      />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-10 text-center text-sm text-slate-400">
                No events returned for this view.
              </div>
            )}
          </section>

          <aside className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-white">
                Selected event
              </h3>
              <p className="text-sm text-slate-400">
                {selectedEvent ? selectedEvent._id : "Choose an event to edit."}
              </p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <TextField
                label="Title"
                value={form.title}
                onChange={(value) =>
                  setForm((current) => ({ ...current, title: value }))
                }
                disabled={!selectedEvent}
              />
              <DateTimeField
                label="Start date"
                value={form.startDate}
                onChange={(value) =>
                  setForm((current) => ({ ...current, startDate: value }))
                }
                disabled={!selectedEvent}
              />
              <DateTimeField
                label="End date"
                value={form.endDate}
                onChange={(value) =>
                  setForm((current) => ({ ...current, endDate: value }))
                }
                disabled={!selectedEvent}
              />
              <TextField
                label="Location"
                value={form.location}
                onChange={(value) =>
                  setForm((current) => ({ ...current, location: value }))
                }
                disabled={!selectedEvent}
              />
              <TextField
                label="Status"
                value={form.status}
                onChange={(value) =>
                  setForm((current) => ({ ...current, status: value }))
                }
                disabled={!selectedEvent}
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
                  disabled={!selectedEvent}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60"
                />
              </label>

              <button
                type="submit"
                disabled={!selectedEvent || isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Edit event
              </button>
            </form>

            <button
              type="button"
              onClick={() => setIsDeletePending(true)}
              disabled={!selectedEvent || isSaving}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/15 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete event
            </button>

            {isDeletePending && (
              <div className="mt-3">
                <ConfirmAction
                  message={`Delete "${selectedEvent ? getEventTitle(selectedEvent) : selectedId}"? This cannot be undone.`}
                  confirmLabel="Delete event"
                  disabled={isSaving}
                  onConfirm={handleDelete}
                  onCancel={() => setIsDeletePending(false)}
                />
              </div>
            )}

            <div className="mt-6 border-t border-slate-800 pt-5">
              <TextField
                label="Livestream platform"
                value={form.liveStreamPlatform}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    liveStreamPlatform: value,
                  }))
                }
                disabled={!selectedEvent}
              />
              <div className="mt-4">
                <TextField
                  label="Livestream URL"
                  value={form.liveStreamUrl}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, liveStreamUrl: value }))
                  }
                  disabled={!selectedEvent}
                />
              </div>
              <div className="mt-4">
                <TextField
                  label="Livestream thumbnail"
                  value={form.liveStreamThumbnail}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      liveStreamThumbnail: value,
                    }))
                  }
                  disabled={!selectedEvent}
                />
              </div>
              <button
                type="button"
                onClick={handleLivestreamUpdate}
                disabled={!selectedEvent || isSaving}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800 disabled:opacity-60"
              >
                <Radio className="h-4 w-4" />
                Update livestream
              </button>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

function EventMeta({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-slate-500" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function TextField({
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
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
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60"
      />
    </label>
  );
}

function DateField({
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
  const selected = value ? new Date(value) : null;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) =>
          onChange(date ? date.toISOString().split("T")[0] : "")
        }
        disabled={disabled}
        dateFormat="MMM d, yyyy"
        placeholderText="Pick a date"
        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60"
        calendarClassName="!bg-slate-900 !border-slate-700 !text-white"
        wrapperClassName="w-full"
      />
    </label>
  );
}

function DateTimeField({
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
  // Convert datetime-local string (e.g. "2025-06-01T14:30") to Date
  const selected = value ? new Date(value) : null;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-300">
        {label}
      </span>
      <DatePicker
        selected={selected}
        onChange={(date: Date | null) => {
          if (!date) return onChange("");
          const pad = (n: number) => String(n).padStart(2, "0");
          onChange(
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`,
          );
        }}
        disabled={disabled}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        dateFormat="MMM d, yyyy h:mm aa"
        placeholderText="Pick a date & time"
        className="h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-60"
        calendarClassName="!bg-slate-900 !border-slate-700 !text-white"
        wrapperClassName="w-full"
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
