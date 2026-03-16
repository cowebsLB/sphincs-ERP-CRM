import type { ApiResponse } from "@sphincs/shared-types";

export class ApiClient {
  constructor(private readonly baseUrl: string, private readonly token?: string) {}

  async get<T>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : undefined
    });
    return response.json() as Promise<ApiResponse<T>>;
  }
}

