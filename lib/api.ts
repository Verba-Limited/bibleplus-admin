import axiosInstance from "./axios";
import { clearAuthSession, storeAuthSession, type AdminUser } from "./auth";

export interface LoginResponse {
  accessToken: string;
  user: AdminUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AnalyticsOverview {
  totalUsers: number;
  totalBlogs: number;
  totalEvents: number;
  totalPrayers: number;
  totalLikes: number;
  totalBookmarks: number;
  totalNotifications: number;
}

export interface AnalyticsActivityDay {
  date: string;
  users: number;
  blogs: number;
  prayers: number;
  events: number;
}

export interface TrendingBlog {
  _id: string;
  title: string;
  slug?: string;
  content?: string;
  likes?: number;
  views?: number;
  createdAt?: string;
}

export interface ModerationQueueCounts {
  pendingPrayers: number;
  flaggedPrayers: number;
  pendingComments: number;
  flaggedComments: number;
  total: number;
}

export interface ModerationPrayer {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  visibility?: string;
  status?: string;
  image?: string;
  prayCount?: number;
  isAnswered?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface ModerationComment {
  _id: string;
  userId?: string;
  content?: string;
  text?: string;
  message?: string;
  status?: string;
  resourceType?: string;
  resourceId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ModerationListResponse<T> {
  success: boolean;
  data?: {
    prayers?: T[];
    comments?: T[];
    total?: number;
    page?: number;
    pages?: number;
  };
  message?: string;
  error?: string;
}

export interface AnalyticsTrending {
  trendingBlogs?: TrendingBlog[];
  trendingPrayers?: unknown[];
  trendingEvents?: unknown[];
}

export interface SystemHealth {
  mongoStatus: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers?: number;
  };
}

export interface BibleplusEvent {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  image?: string;
  status?: string;
  frequency?: string;
  liveStream?: {
    platform?: string;
    url?: string;
    thumbnail?: string;
  };
  livestreamUrl?: string;
  livestream?: string;
  isOnline?: boolean;
  isLive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface EventPayload {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  category?: string;
  coverImage?: string;
  isOnline?: boolean;
  frequency?: string;
  liveStream?: {
    platform?: string;
    url?: string;
    thumbnail?: string;
  };
}

export interface EventBannerUploadResponse {
  file: string;
  url: string;
}

export interface EventCategory {
  _id: string;
  name: string;
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export interface EventUploadFile {
  file: string;
  url: string;
}

export interface EventGalleryUploadResponse {
  success: boolean;
  images: EventUploadFile[];
}

export interface EventSpeaker {
  _id: string;
  name: string;
  bio?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// export interface BibleplusBlog {
//   _id: string;
//   title: string;
//   content?: string;
//   slug?: string;
//   coverImage?: string;
//   image?: string;
//   published?: boolean;
//   isPublished?: boolean;
//   status?: string;
//   author?: string;
//   createdAt?: string;
//   updatedAt?: string;
//   [key: string]: unknown;
// }

export interface BibleplusBlog {
  _id: string;
  title: string;
  content?: string;
  slug?: string;
  summary?: string;
  excerpt?: string;
  readingTime?: number;
  coverImage?: string;
  image?: string;
  category?: string;
  tags?: string[];
  authorId?: string;
  author?: string;
  featured?: boolean;
  status?: "draft" | "published" | string;
  views?: number;
  source?: string;
  externalUrl?: string;
  isFetched?: boolean;
  published?: boolean;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface QuizQuestionPayload {
  question: string;
  options: string[];
  correctAnswer: string;
  level: number;
  difficulty: string;
}

export interface QuizQuestion extends QuizQuestionPayload {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface BibleplusBook {
  _id: string;
  title: string;
  author: string;
  description?: string;
  coverImage?: string;
  category?: string;
  audience?: string;
  source?: string;
  totalChapters?: number;
  isFetched?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface BooksListResponse extends ApiResponse<BibleplusBook[]> {
  count?: number;
}

export interface BibleplusNotification {
  _id: string;
  target?: string;
  userId?: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface BibleplusPrayer {
  _id: string;
  user?: {
    _id?: string;
    email?: string;
    username?: string;
  };
  userId?: string;
  title?: string;
  description?: string;
  visibility?: string;
  status?: string;
  isAnswered?: boolean;
  image?: string;
  prayCount?: number;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface PrayersListResponse extends ApiResponse<
  BibleplusPrayer[] | { prayers?: BibleplusPrayer[] }
> {
  count?: number;
  total?: number;
}

export interface NotificationsListResponse extends ApiResponse<
  BibleplusNotification[]
> {
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
}

export interface NotificationPayload {
  title: string;
  message: string;
}

export interface SendNotificationPayload extends NotificationPayload {
  userId: string;
}

export interface VerseOfDayPayload {
  date: string;
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface VerseOfDay extends VerseOfDayPayload {
  _id: string;
  locked?: boolean;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface AdminUserRecord {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role?: string;
  verified?: boolean;
  isDeleted?: boolean;
  fcmToken?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  notificationSettings?: {
    push?: boolean;
    email?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AdminUsersListResponse {
  success: boolean;
  data?: {
    users?: AdminUserRecord[];
    total?: number;
    page?: number;
    pages?: number;
  };
  message?: string;
  error?: string;
}

export interface AdminManagementUser {
  _id: string;
  username: string;
  email?: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface AdminManagementPayload {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface AuditLog {
  _id: string;
  adminId: string;
  adminUsername: string;
  action: "CREATE" | "UPDATE" | "DELETE" | string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  [key: string]: unknown;
}

export interface AuditLogsListResponse {
  success: boolean;
  data?: {
    logs?: AuditLog[];
    total?: number;
    page?: number;
    pages?: number;
  };
  message?: string;
  error?: string;
}

export type ExportKind = "users" | "prayers";

// Admin API endpoints
export const adminApi = {
  login: async (username: string, password: string) => {
    const response = await axiosInstance.post<ApiResponse<LoginResponse>>(
      "/admin/login",
      { username, password },
    );

    if (response.data.success && response.data.data) {
      storeAuthSession(response.data.data);
    }

    return response.data;
  },

  logout: async () => {
    try {
      const response = await axiosInstance.post<ApiResponse>("/admin/logout");
      return response.data;
    } finally {
      clearAuthSession();
    }
  },

  getProfile: async () => {
    const response = await axiosInstance.get<ApiResponse>("/admin/profile");
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await axiosInstance.put<ApiResponse>(
      "/admin/profile",
      data,
    );
    return response.data;
  },
};

// Dashboard API endpoints
export const dashboardApi = {
  getStats: async () => {
    const response = await axiosInstance.get<ApiResponse>("/dashboard/stats");
    return response.data;
  },

  getAnalytics: async (params?: any) => {
    const response = await axiosInstance.get<ApiResponse>(
      "/dashboard/analytics",
      {
        params,
      },
    );
    return response.data;
  },
};

// Admin auditLogsApi enpoint

export const auditLogsApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    const response = await axiosInstance.get<AuditLogsListResponse>(
      "/admin/audit-logs",
      { params },
    );
    return response.data;
  },
};

export const exportsApi = {
  getUsers: async () => {
    const response = await axiosInstance.get<string>("/admin/exports/users", {
      responseType: "text",
    });
    return response.data;
  },

  getPrayers: async () => {
    const response = await axiosInstance.get<string>("/admin/exports/prayers", {
      responseType: "text",
    });
    return response.data;
  },
};

export const moderationApi = {
  getQueueCounts: async () => {
    const response = await axiosInstance.get<
      ApiResponse<ModerationQueueCounts>
    >("/admin/moderation/queue");
    return response.data;
  },

  getPrayers: async (params?: { status?: string }) => {
    const response = await axiosInstance.get<
      ModerationListResponse<ModerationPrayer>
    >("/admin/moderation/prayers", { params });
    return response.data;
  },

  getComments: async (params?: { status?: string }) => {
    const response = await axiosInstance.get<
      ModerationListResponse<ModerationComment>
    >("/admin/moderation/comments", { params });
    return response.data;
  },

  approvePrayer: async (id: string) => {
    const response = await axiosInstance.put<ApiResponse>(
      `/admin/moderation/prayers/${id}/approve`,
    );
    return response.data;
  },

  flagPrayer: async (id: string) => {
    const response = await axiosInstance.put<ApiResponse>(
      `/admin/moderation/prayers/${id}/flag`,
    );
    return response.data;
  },

  rejectPrayer: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/moderation/prayers/${id}/reject`,
    );
    return response.data;
  },

  // ASSUMED — verify against your backend
  approveComment: async (id: string) => {
    const response = await axiosInstance.put<ApiResponse>(
      `/admin/moderation/comments/${id}/approve`,
    );
    return response.data;
  },

  // ASSUMED — verify against your backend
  flagComment: async (id: string) => {
    const response = await axiosInstance.put<ApiResponse>(
      `/admin/moderation/comments/${id}/flag`,
    );
    return response.data;
  },

  // ASSUMED — verify against your backend
  rejectComment: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/moderation/comments/${id}/reject`,
    );
    return response.data;
  },
};

// --- Add moderationApi to the default export object at the bottom of lib/api.ts ---

// Admin analytics endpoints
export const analyticsApi = {
  getOverview: async () => {
    const response = await axiosInstance.get<ApiResponse<AnalyticsOverview>>(
      "/admin/analytics/overview",
    );
    return response.data;
  },

  getActivity: async () => {
    const response = await axiosInstance.get<
      ApiResponse<AnalyticsActivityDay[]>
    >("/admin/analytics/activity");
    return response.data;
  },

  getTrending: async () => {
    const response = await axiosInstance.get<ApiResponse<AnalyticsTrending>>(
      "/admin/analytics/trending",
    );
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await axiosInstance.get<ApiResponse<SystemHealth>>(
      "/admin/analytics/system",
    );
    return response.data;
  },
};

// Events endpoints
export const eventsApi = {
  create: async (data: EventPayload) => {
    const response = await axiosInstance.post<ApiResponse<BibleplusEvent>>(
      "/admin/events",
      data,
    );
    return response.data;
  },

  getAll: async (params?: any) => {
    const response = await axiosInstance.get<ApiResponse<BibleplusEvent[]>>(
      "/events",
      { params },
    );
    return response.data;
  },

  getUpcoming: async () => {
    const response =
      await axiosInstance.get<ApiResponse<BibleplusEvent[]>>(
        "/events/upcoming",
      );
    return response.data;
  },

  getPast: async () => {
    const response =
      await axiosInstance.get<ApiResponse<BibleplusEvent[]>>("/events/past");
    return response.data;
  },

  search: async (query: string) => {
    const response = await axiosInstance.get<ApiResponse<BibleplusEvent[]>>(
      "/events/search",
      { params: { q: query } },
    );
    return response.data;
  },

  update: async (id: string, data: Partial<BibleplusEvent>) => {
    const response = await axiosInstance.put<ApiResponse<BibleplusEvent>>(
      `/admin/events/${id}`,
      data,
    );
    return response.data;
  },

  updateLivestream: async (
    id: string,
    liveStream: NonNullable<BibleplusEvent["liveStream"]>,
  ) => {
    const response = await axiosInstance.put<ApiResponse<BibleplusEvent>>(
      `/admin/events/${id}/live`,
      liveStream,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<BibleplusEvent>>(
      `/admin/events/${id}`,
    );
    return response.data;
  },

  uploadBanner: async (banner: File) => {
    const data = new FormData();
    data.append("banner", banner);

    const response = await axiosInstance.post<EventBannerUploadResponse>(
      "/admin/events/upload-banner",
      data,
    );
    return response.data;
  },

  uploadGallery: async (images: FileList | File[]) => {
    const data = new FormData();
    Array.from(images).forEach((image) => {
      data.append("images", image);
    });

    const response = await axiosInstance.post<EventGalleryUploadResponse>(
      "/admin/events/gallery/upload",
      data,
    );
    return response.data;
  },

  createCategory: async (name: string) => {
    const response = await axiosInstance.post<ApiResponse<EventCategory>>(
      "/admin/event-categories",
      { name },
    );
    return response.data;
  },

  createSpeaker: async (data: { name: string; bio: string }) => {
    const response = await axiosInstance.post<ApiResponse<EventSpeaker>>(
      "/admin/speakers",
      data,
    );
    return response.data;
  },
};

// Admin blog endpoints
export const blogsApi = {
  getAll: async (params?: any) => {
    const paths = ["/blogs", "/blog"];

    for (const path of paths) {
      const response = await axiosInstance.get<
        ApiResponse<BibleplusBlog[]> | BibleplusBlog[]
      >(path, {
        params,
        validateStatus: (status) => status < 500,
      });

      if (response.status >= 200 && response.status < 300) {
        return Array.isArray(response.data)
          ? { success: true, data: response.data }
          : response.data;
      }
    }

    return {
      success: true,
      data: [],
      message: "No public blog listing endpoint responded successfully.",
    };
  },

  create: async (data: FormData) => {
    const response = await axiosInstance.post<ApiResponse<BibleplusBlog>>(
      "/admin/blogs",
      data,
    );
    return response.data;
  },

  update: async (id: string, data: FormData) => {
    const response = await axiosInstance.put<ApiResponse<BibleplusBlog>>(
      `/admin/blogs/${id}`,
      data,
    );
    return response.data;
  },

  publish: async (id: string) => {
    const response = await axiosInstance.put<ApiResponse<BibleplusBlog>>(
      `/admin/blogs/${id}/publish`,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/blogs/${id}`,
    );
    return response.data;
  },

  refreshExternal: async () => {
    const response = await axiosInstance.post<ApiResponse>(
      "/admin/blogs/refresh",
    );
    return response.data;
  },

  deleteComment: async (commentId: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/blogs/comments/${commentId}`,
    );
    return response.data;
  },
};

// Users management API endpoints
export const usersApi = {
  getAll: async (params?: any) => {
    const response = await axiosInstance.get<ApiResponse>("/users", { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse>(`/users/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await axiosInstance.post<ApiResponse>("/users", data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await axiosInstance.put<ApiResponse>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(`/users/${id}`);
    return response.data;
  },
};

// Admin users endpoints
export const adminUsersApi = {
  getAll: async (params?: any) => {
    const response = await axiosInstance.get<AdminUsersListResponse>(
      "/admin/users",
      { params },
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosInstance.get<
      ApiResponse<AdminUserRecord | { user?: AdminUserRecord }>
    >(`/admin/users/${id}`);
    return response.data;
  },

  resetPassword: async (id: string, data?: { password?: string }) => {
    const response = await axiosInstance.put<ApiResponse>(
      `/admin/users/${id}/reset-password`,
      data || {},
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/users/${id}`,
    );
    return response.data;
  },
};

export const adminManagementApi = {
  getAll: async () => {
    const response = await axiosInstance.get<ApiResponse<AdminManagementUser[]>>(
      "/admin/management",
    );
    return response.data;
  },

  create: async (data: AdminManagementPayload) => {
    const response = await axiosInstance.post<ApiResponse<AdminManagementUser>>(
      "/admin/management",
      data,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/management/${id}`,
    );
    return response.data;
  },
};

// Quiz endpoints
export const quizApi = {
  createBulk: async (questions: QuizQuestionPayload[]) => {
    const response = await axiosInstance.post<
      ApiResponse<QuizQuestion[]> | QuizQuestion[]
    >("/admin/quiz/bulk", questions);
    return response.data;
  },
};

// Books endpoints
export const booksApi = {
  getAll: async (params?: any) => {
    const response = await axiosInstance.get<BooksListResponse>("/books", {
      params,
    });
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await axiosInstance.post<ApiResponse<BibleplusBook>>(
      "/admin/books",
      data,
    );
    return response.data;
  },

  update: async (id: string, data: FormData) => {
    const response = await axiosInstance.put<ApiResponse<BibleplusBook>>(
      `/admin/books/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<BibleplusBook>>(
      `/admin/books/${id}`,
    );
    return response.data;
  },
};

// Prayers endpoints
export const prayersApi = {
  getMine: async () => {
    const response =
      await axiosInstance.get<PrayersListResponse>("/prayer/mine");
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/prayers/${id}`,
    );
    return response.data;
  },
};

// Notifications endpoints
export const notificationsApi = {
  getAll: async (params?: any) => {
    const response = await axiosInstance.get<NotificationsListResponse>(
      "/admin/notifications/all",
      { params },
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(
      `/admin/notifications/${id}`,
    );
    return response.data;
  },

  resend: async (id: string) => {
    const response = await axiosInstance.post<ApiResponse>(
      `/admin/notifications/${id}/resend`,
    );
    return response.data;
  },

  sendToUser: async (data: SendNotificationPayload) => {
    const response = await axiosInstance.post<ApiResponse>(
      "/admin/notifications/send",
      data,
    );
    return response.data;
  },

  broadcast: async (data: NotificationPayload) => {
    const response = await axiosInstance.post<
      ApiResponse<BibleplusNotification>
    >("/admin/notifications/broadcast", data);
    return response.data;
  },
};

// Verse endpoints
export const verseApi = {
  setVerseOfDay: async (data: VerseOfDayPayload) => {
    const response = await axiosInstance.post<ApiResponse<VerseOfDay>>(
      "/admin/verse/set",
      data,
    );
    return response.data;
  },
};

// Content API endpoints
export const contentApi = {
  getAll: async (params?: any) => {
    const response = await axiosInstance.get<ApiResponse>("/content", {
      params,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosInstance.get<ApiResponse>(`/content/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await axiosInstance.post<ApiResponse>("/content", data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await axiosInstance.put<ApiResponse>(
      `/content/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse>(`/content/${id}`);
    return response.data;
  },
};

export default {
  adminApi,
  analyticsApi,
  blogsApi,
  dashboardApi,
  eventsApi,
  booksApi,
  notificationsApi,
  verseApi,
  quizApi,
  adminUsersApi,
  usersApi,
  contentApi,
  auditLogsApi,
  exportsApi,
  adminManagementApi,
  prayersApi,
};
