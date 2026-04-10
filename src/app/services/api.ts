import axios from 'axios';

// Get the base URL from environment variables (Coolify) or fallback to local for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5106';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with token refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        // Updated to use dynamic BASE_URL for refresh calls
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
};

// Users
export const usersApi = {
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
  getMe: () => api.get('/users/me'),
  getByRole: (role: string) => api.get(`/users/by-role/${role}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Cases
export const casesApi = {
  getAll: (params?: any) => api.get('/cases', { params }),
  getById: (id: string) => api.get(`/cases/${id}`),
  create: (data: any) => api.post('/cases', data),
  update: (id: string, data: any) => api.put(`/cases/${id}`, data),
  updateStatus: (id: string, data: any) => api.patch(`/cases/${id}/status`, data),
  addNote: (caseId: string, data: any) => api.post(`/cases/${caseId}/notes`, data),
  addDocument: (caseId: string, file: File, name?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    return api.post(`/cases/${caseId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id: string) => api.delete(`/cases/${id}`),
  forward: (id: string, data: { targetRole: string; note?: string; recommendation?: string; verdict?: string; assignedToUserId?: string; forwardToAll?: boolean }) =>
    api.post(`/cases/${id}/forward`, data),
  createReport: (caseId: string, data: { content: string; isDraft?: boolean; isFinal?: boolean }) =>
    api.post(`/cases/${caseId}/reports`, data),
  getReports: (caseId: string) => api.get(`/cases/${caseId}/reports`),
  updateReport: (caseId: string, reportId: string, data: any) => api.put(`/cases/${caseId}/reports/${reportId}`, data),
  getMyCases: (params?: any) => api.get('/cases/my-cases', { params }),
  getMyCasesCount: () => api.get('/cases/my-cases/count'),
};

// Hearings
export const hearingsApi = {
  getAll: (caseId?: string) => api.get('/hearings', { params: caseId ? { caseId } : {} }),
  getById: (id: string) => api.get(`/hearings/${id}`),
  create: (data: any) => api.post('/hearings', data),
  update: (id: string, data: any) => api.put(`/hearings/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/hearings/${id}/status`, { status }),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// Roles & Permissions
export const rolesApi = {
  getAll: () => api.get('/roles'),
  getPermissions: (id: string) => api.get(`/roles/${id}/permissions`),
  updatePermissions: (id: string, data: any) => api.put(`/roles/${id}/permissions`, data),
  getByName: (roleName: string) => api.get(`/roles/by-name/${roleName}`),
};

// Notifications
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

// System Settings
export const checklistApi = {
  getAll: () => api.get('/verification-checklist'),
  create: (data: { label: string }) => api.post('/verification-checklist', data),
  update: (id: string, data: { label: string; order?: number }) => api.put(`/verification-checklist/${id}`, data),
  delete: (id: string) => api.delete(`/verification-checklist/${id}`),
  createVerification: (caseId: string, data: { comment: string; checklistResultsJson?: string }) =>
    api.post(`/verification-checklist/case/${caseId}`, data),
  getVerifications: (caseId: string) => api.get(`/verification-checklist/case/${caseId}`),
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  getByCategory: (category: string) => api.get(`/settings/category/${category}`),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
};

export const articlesApi = {
  getAll: () => api.get('/articles'),
  create: (data: { articleNo: string; title: string; description: string; order?: number }) => api.post('/articles', data),
  update: (id: string, data: any) => api.put(`/articles/${id}`, data),
  delete: (id: string) => api.delete(`/articles/${id}`),
};

export const ranksApi = {
  getAll: () => api.get('/ranks'),
  create: (data: { name: string; order?: number }) => api.post('/ranks', data),
  update: (id: string, data: any) => api.put(`/ranks/${id}`, data),
  delete: (id: string) => api.delete(`/ranks/${id}`),
};

export const forwardingRulesApi = {
  getAll: () => api.get('/forwarding-rules'),
  getForRole: (role: string) => api.get(`/forwarding-rules/from/${role}`),
  getSpecial: (role: string) => api.get(`/forwarding-rules/special/${role}`),
  create: (data: { fromRole: string; toRole: string; resultStatus?: string }) => api.post('/forwarding-rules', data),
  update: (id: string, data: any) => api.put(`/forwarding-rules/${id}`, data),
  delete: (id: string) => api.delete(`/forwarding-rules/${id}`),
};