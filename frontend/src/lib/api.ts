const BASE = "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string>) },
    ...options,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: any; accessToken: string; refreshToken: string }>("/login", {
        method: "POST", body: JSON.stringify({ email, password }),
      }),
    register: (data: { name: string; email: string; password: string; role?: string; expertise?: string }) =>
      request<{ user: any }>("/register", { method: "POST", body: JSON.stringify(data) }),
    logout: () =>
      request<{ ok: boolean }>("/logout", { method: "POST", body: "{}" }),
    me: () => request<{ user: any | null }>("/me"),
    refresh: (refreshToken: string) =>
      request<{ accessToken: string; user: any }>("/refresh", {
        method: "POST", body: JSON.stringify({ refreshToken }),
      }),
    verifyEmail: (token: string) =>
      request<{ message: string }>("/email/verify", { method: "POST", body: JSON.stringify({ token }) }),
    requestPasswordReset: (email: string) =>
      request<{ message: string }>("/password/reset/request", { method: "POST", body: JSON.stringify({ email }) }),
    resetPassword: (token: string, newPassword: string) =>
      request<{ message: string }>("/password/reset", { method: "POST", body: JSON.stringify({ token, newPassword }) }),
  },
  ventures: {
    list: (q?: string) => request<{ ventures: any[] }>(`/ventures${q ? `?q=${q}` : ""}`),
    create: (data: any) => request<{ venture: any; similarVenture?: any }>("/ventures", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/ventures/${id}`, { method: "DELETE" }),
    update: (id: number, data: any) => request<{ venture: any }>(`/ventures/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    all: () => request<{ ventures: any[] }>("/ventures/all"),
  },
  mentors: {
    search: (q: string, ventureId?: number) => request<{ mentors: any[] }>(`/mentors?q=${q}${ventureId ? `&ventureId=${ventureId}` : ""}`),
  },
  users: {
    list: () => request<{ users: any[] }>("/users"),
    delete: (id: number) => request<{ message: string }>(`/users/${id}`, { method: "DELETE" }),
    updateRole: (id: number, role: string) => request<{ user: any }>(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
    analytics: () => request<{ totalUsers: number; totalVentures: number; totalReports: number; totalComments: number; roleCounts: any[]; stageCounts: any[]; sectorCounts: any[] }>("/users/analytics"),
  },
  ai: {
    status: () => request<{ enabled: boolean; provider: string | null; model: string | null }>("/ai/status"),
    validate: (venture: any) => request<{ source: string; result: any }>("/ai/validate", { method: "POST", body: JSON.stringify({ venture }) }),
    nlp: (text: string) => request<{ source: string; result: any }>("/ai/nlp", { method: "POST", body: JSON.stringify({ text }) }),
    faq: (question: string) => request<{ source: string; result: any }>("/ai/faq", { method: "POST", body: JSON.stringify({ question }) }),
    suggestions: (message: string, venture?: any) => request<{ source: string; result: any }>("/ai/suggestions", { method: "POST", body: JSON.stringify({ message, venture }) }),
    roadmap: (venture: any, score: number) => request<{ source: string; result: any }>("/ai/roadmap", { method: "POST", body: JSON.stringify({ venture, score }) }),
    cnnPredict: (imageBase64: string) => request<{ prediction: any }>("/ai/cnn-predict", { method: "POST", body: JSON.stringify({ image_base64: imageBase64 }) }),
  },
  sessions: {
    list: () => request<{ sessions: any[] }>("/sessions"),
    revoke: (sessionId: number) => request<{ message: string }>("/sessions/revoke", { method: "POST", body: JSON.stringify({ sessionId }) }),
  },
  twoFactor: {
    setup: () => request<{ secret: string; backupCodes: string[] }>("/2fa/setup", { method: "POST", body: "{}" }),
    verify: (token: string) => request<{ message: string }>("/2fa/verify", { method: "POST", body: JSON.stringify({ token }) }),
    enable: (token: string) => request<{ message: string }>("/2fa/enable", { method: "POST", body: JSON.stringify({ token }) }),
    status: () => request<{ twoFactorEnabled: boolean }>("/2fa/status"),
  },
  comments: {
    list: (ventureId: number) => request<{ comments: any[] }>(`/comments/${ventureId}`),
    create: (ventureId: number, content: string, parentId?: number) =>
      request<{ comment: any }>("/comments", { method: "POST", body: JSON.stringify({ ventureId, content, parentId }) }),
    update: (id: number, content: string) =>
      request<{ comment: any }>(`/comments/${id}`, { method: "PUT", body: JSON.stringify({ content }) }),
    delete: (id: number) =>
      request<{ message: string }>(`/comments/${id}`, { method: "DELETE" }),
  },
  reports: {
    export: (type: string) => request<{ url: string; report?: any }>(`/reports/export?type=${type}`),
  },
  monitoring: {
    system: () => request<{ uptime: number; version: string; node: string; platform: string; memory: any; cpu: any }>("/monitoring/system"),
    logs: () => request<{ logs: Array<{ timestamp: string; level: string; msg: string }> }>("/monitoring/logs"),
  },
  billing: {
    plans: () => request<{ plans: any[] }>("/billing/plans"),
    createCheckout: () => request<{ url: string }>("/billing/create-checkout", { method: "POST" }),
  },
};
