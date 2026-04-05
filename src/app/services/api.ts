import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5106/api',
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
        const response = await axios.post('http://localhost:5106/api/auth/refresh', { refreshToken });
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

export const API_BASE_URL = 'http://localhost:5106';

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
  forward: (id: string, data: { targetRole: string; note?: string; recommendation?: string; verdict?: string }) =>
    api.post(`/cases/${id}/forward`, data),
  createReport: (caseId: string, data: { content: string; isDraft?: boolean }) =>
    api.post(`/cases/${caseId}/reports`, data),
  getReports: (caseId: string) => api.get(`/cases/${caseId}/reports`),
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
export const settingsApi = {
  getAll: () => api.get('/settings'),
  getByCategory: (category: string) => api.get(`/settings/category/${category}`),
  getByKey: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, value: string) => api.put(`/settings/${key}`, { value }),
};
