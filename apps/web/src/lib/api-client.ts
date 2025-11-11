const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      return data;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  }

  // Shift APIs
  async getShifts() {
    return this.request<any[]>("/api/shifts");
  }

  async getAllShifts() {
    return this.request<any[]>("/api/shifts/all");
  }

  async getShift(id: string) {
    return this.request<any>(`/api/shifts/${id}`);
  }

  async createShift(data: {
    name: string;
    code?: string;
    startTime: string;
    endTime: string;
    breakDuration?: number;
    workDuration?: number;
    color?: string;
    description?: string;
    autoApprove?: boolean;
    companyId?: string;
  }) {
    return this.request<any>("/api/shifts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateShift(
    id: string,
    data: {
      name?: string;
      code?: string;
      startTime?: string;
      endTime?: string;
      breakDuration?: number;
      workDuration?: number;
      color?: string;
      description?: string;
      autoApprove?: boolean;
      isActive?: boolean;
      companyId?: string;
    },
  ) {
    return this.request<any>(`/api/shifts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async toggleShift(id: string) {
    return this.request<any>(`/api/shifts/${id}/toggle`, {
      method: "PATCH",
    });
  }

  async deleteShift(id: string) {
    return this.request<any>(`/api/shifts/${id}`, {
      method: "DELETE",
    });
  }

  // Shift Schedule APIs
  async getShiftSchedules(params?: {
    employeeId?: string;
    groupId?: string;
    shiftId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const queryString = queryParams.toString();
    return this.request<any[]>(`/api/shift-schedules${queryString ? `?${queryString}` : ""}`);
  }

  async getShiftSchedule(id: string) {
    return this.request<any>(`/api/shift-schedules/${id}`);
  }

  async createShiftSchedule(data: {
    shiftId: string;
    assignmentType: "employee" | "group";
    employeeId?: string;
    employeeGroupId?: string;
    scheduledFromDate: string;
    scheduledToDate: string;
    daysOfWeek: number[];
    note?: string;
    createdBy: string;
  }) {
    return this.request<any>("/api/shift-schedules", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateShiftSchedule(
    id: string,
    data: {
      shiftId?: string;
      scheduledFromDate?: string;
      scheduledToDate?: string;
      daysOfWeek?: number[];
      note?: string;
    },
  ) {
    return this.request<any>(`/api/shift-schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteShiftSchedule(id: string) {
    return this.request<any>(`/api/shift-schedules/${id}`, {
      method: "DELETE",
    });
  }

  async getEmployeeSchedules(
    employeeId: string,
    params?: {
      startDate?: string;
      endDate?: string;
    },
  ) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const queryString = queryParams.toString();
    return this.request<any[]>(
      `/api/shift-schedules/employee/${employeeId}${queryString ? `?${queryString}` : ""}`,
    );
  }

  // Employee Group APIs
  async getEmployeeGroups() {
    return this.request<any[]>("/api/employee-groups");
  }

  async getEmployeeGroup(id: string) {
    return this.request<any>(`/api/employee-groups/${id}`);
  }

  async createEmployeeGroup(data: {
    name: string;
    description?: string;
    createdBy: string;
    memberIds?: string[];
  }) {
    return this.request<any>("/api/employee-groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateEmployeeGroup(
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ) {
    return this.request<any>(`/api/employee-groups/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteEmployeeGroup(id: string) {
    return this.request<any>(`/api/employee-groups/${id}`, {
      method: "DELETE",
    });
  }

  async addGroupMembers(id: string, employeeIds: string[]) {
    return this.request<any>(`/api/employee-groups/${id}/members`, {
      method: "POST",
      body: JSON.stringify({ employeeIds }),
    });
  }

  async removeGroupMembers(id: string, employeeIds: string[]) {
    return this.request<any>(`/api/employee-groups/${id}/members`, {
      method: "DELETE",
      body: JSON.stringify({ employeeIds }),
    });
  }

  // Employee APIs
  async getEmployees() {
    return this.request<any[]>("/api/employees");
  }

  async getEmployee(id: string) {
    return this.request<any>(`/api/employees/${id}`);
  }

  async searchEmployees(params?: { q?: string; departmentId?: string }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    const queryString = queryParams.toString();
    return this.request<any[]>(`/api/employees/search${queryString ? `?${queryString}` : ""}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
