export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  organizationId: string;
  branchId?: string | null;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionState extends SessionTokens {
  user: AuthUser;
}

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiHttpError";
  }
}

export class AuthSessionExpiredError extends Error {
  constructor(message = "Your session expired. Please sign in again.") {
    super(message);
    this.name = "AuthSessionExpiredError";
  }
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async rawRequest<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiHttpError(response.status, errorText || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async login(
    email: string,
    password: string
  ): Promise<SessionTokens & { tokenType: string; user: AuthUser }> {
    return this.rawRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  }

  async signup(
    email: string,
    password: string
  ): Promise<SessionTokens & { tokenType: string; user: AuthUser }> {
    return this.rawRequest("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
  }

  async refresh(refreshToken: string): Promise<SessionTokens & { tokenType: string }> {
    return this.rawRequest("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });
  }

  async authorized<T>(
    path: string,
    tokens: SessionTokens,
    init?: RequestInit
  ): Promise<{ data: T; tokens: SessionTokens }> {
    const perform = (accessToken: string) =>
      fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
          Authorization: `Bearer ${accessToken}`
        }
      });

    let response = await perform(tokens.accessToken);
    if (response.status !== 401) {
      if (!response.ok) {
        throw new ApiHttpError(response.status, (await response.text()) || `HTTP ${response.status}`);
      }
      return { data: (await response.json()) as T, tokens };
    }

    let refreshed: SessionTokens & { tokenType: string };
    try {
      refreshed = await this.refresh(tokens.refreshToken);
    } catch (error) {
      throw new AuthSessionExpiredError(
        error instanceof Error && error.message ? error.message : "Your session expired. Please sign in again."
      );
    }
    response = await perform(refreshed.accessToken);
    if (!response.ok) {
      if (response.status === 401) {
        throw new AuthSessionExpiredError((await response.text()) || "Your session expired. Please sign in again.");
      }
      throw new ApiHttpError(response.status, (await response.text()) || `HTTP ${response.status}`);
    }

    return {
      data: (await response.json()) as T,
      tokens: {
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken
      }
    };
  }
}
