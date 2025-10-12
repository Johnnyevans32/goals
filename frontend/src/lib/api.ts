import { appConfig } from "./config";
import type {
  ApiResponse,
  Goal,
  GoalUpdate,
  CreateGoalRequest,
  User,
  DashboardStats,
  AppError,
  Action,
  CreateActionRequest,
  AIActionSuggestion,
  AICheckInSummary,
} from "./types";

export class ApiError extends Error implements AppError {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(message: string, code: string = "API_ERROR", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = appConfig.api.baseUrl;
    this.timeout = 10000;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      let errorDetails: unknown = null;

      if (response.status === 401) {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
        throw new ApiError("Authentication required", "UNAUTHORIZED");
      }

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
      } catch {}

      throw new ApiError(errorMessage, `HTTP_${response.status}`, errorDetails);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new ApiError("Failed to parse response JSON", "PARSE_ERROR", error);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiError("Request timeout", "TIMEOUT_ERROR");
        }
        throw new ApiError(error.message, "NETWORK_ERROR", error);
      }

      throw new ApiError("Unknown error occurred", "UNKNOWN_ERROR", error);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: "DELETE" });
  }
}

const api = new ApiClient();

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>(
      "/auth/login",
      credentials
    ),

  register: (userData: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>(
      "/auth/register",
      userData
    ),

  getMe: () => api.get<ApiResponse<User>>("/auth/me"),
};

export const goalsApi = {
  getAll: (params?: { page?: number; per_page?: number; all?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params?.all) queryParams.append("all", "true");

    const query = queryParams.toString();
    return api.get<ApiResponse<Goal[]>>(`/goals${query ? `?${query}` : ""}`);
  },

  getById: (id: number) => api.get<ApiResponse<Goal>>(`/goals/${id}`),

  create: (goalData: CreateGoalRequest) =>
    api.post<ApiResponse<Goal>>("/goals", goalData),

  update: (id: number, updates: Partial<Goal>) =>
    api.put<ApiResponse<Goal>>(`/goals/${id}`, updates),

  delete: (id: number) => api.delete<ApiResponse>(`/goals/${id}`),

  createUpdate: (id: number, updateData: { value: number; notes?: string }) =>
    api.post<ApiResponse<GoalUpdate>>(`/goals/${id}/updates`, updateData),

  getUpdates: (id: string) =>
    api.get<ApiResponse<Goal>>(`/goals/${id}`).then((response) => ({
      ...response,
      data: response.data?.goal_updates || [],
    })),

  getDashboardStats: () =>
    api.get<ApiResponse<DashboardStats>>("/goals/stats/dashboard"),
};

export const actionsApi = {
  getByGoalId: (
    goalId: number,
    params?: {
      page?: number;
      per_page?: number;
      status?: string;
      search?: string;
      due_date?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.per_page)
      queryParams.append("per_page", params.per_page.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.search) queryParams.append("search", params.search);
    if (params?.due_date) queryParams.append("due_date", params.due_date);

    const query = queryParams.toString();
    return api.get<ApiResponse<Action[]>>(
      `/goals/${goalId}/actions${query ? `?${query}` : ""}`
    );
  },

  getById: (goalId: number, id: number) =>
    api.get<ApiResponse<Action>>(`/goals/${goalId}/actions/${id}`),

  create: (goalId: number, actionData: CreateActionRequest) =>
    api.post<ApiResponse<Action>>(`/goals/${goalId}/actions`, actionData),

  update: (goalId: number, id: number, updates: Partial<Action>) =>
    api.patch<ApiResponse<Action>>(`/goals/${goalId}/actions/${id}`, updates),

  delete: (goalId: number, id: number) =>
    api.delete<ApiResponse>(`/goals/${goalId}/actions/${id}`),
};

export const aiApi = {
  suggestActions: (goalId: number) =>
    api.post<ApiResponse<AIActionSuggestion[]>>("/ai/suggest-actions", {
      goalId,
    }),

  summarizeCheckin: (goalId: number) =>
    api.post<ApiResponse<AICheckInSummary>>("/ai/summarize-checkin", {
      goalId,
    }),
};

export { api };
export default {
  auth: authApi,
  goals: goalsApi,
  actions: actionsApi,
  ai: aiApi,
};
