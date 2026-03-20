import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, it, expect, vi, afterEach } from "vitest";
import { RootApp } from "./app";
import { ApiClient, AuthSessionExpiredError } from "@sphincs/api-client";

describe("CRM RootApp", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    window.history.pushState({}, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders login when no session exists", () => {
    render(<RootApp />);
    expect(screen.getByRole("heading", { name: "Sign in once for ERP + CRM" })).toBeInTheDocument();
  });

  it("logs in and shows CRM shell", async () => {
    vi.spyOn(ApiClient.prototype, "login").mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      tokenType: "Bearer",
      user: {
        id: "u1",
        email: "admin@sphincs.local",
        roles: ["Admin"],
        organizationId: "org1"
      }
    });
    vi.spyOn(ApiClient.prototype, "authorized").mockImplementation(async (_path, tokens) => {
      return { data: [], tokens };
    });

    render(<RootApp />);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "SPHINCS CRM" })).toBeInTheDocument()
    );
  });

  it("blocks non-crm roles", () => {
    localStorage.setItem(
      "sphincs.session",
      JSON.stringify({
        accessToken: "a",
        refreshToken: "r",
        user: {
          id: "u1",
          email: "staff@sphincs.local",
          roles: ["ERP Manager"],
          organizationId: "org1"
        }
      })
    );
    render(<RootApp />);
    expect(screen.getByText("Your account does not have CRM access.")).toBeInTheDocument();
  });

  it("reuses the shared session key to open CRM without a second login", async () => {
    localStorage.setItem(
      "sphincs.session",
      JSON.stringify({
        accessToken: "shared-access",
        refreshToken: "shared-refresh",
        user: {
          id: "u1",
          email: "admin@sphincs.local",
          roles: ["Admin"],
          organizationId: "org1"
        }
      })
    );
    vi.spyOn(ApiClient.prototype, "authorized").mockImplementation(async (_path, tokens) => {
      return { data: [], tokens };
    });

    render(<RootApp />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "SPHINCS CRM" })).toBeInTheDocument()
    );
  });

  it("clears the shared session and returns to login when the session is invalidated", async () => {
    localStorage.setItem(
      "sphincs.session",
      JSON.stringify({
        accessToken: "expired-access",
        refreshToken: "expired-refresh",
        user: {
          id: "u1",
          email: "admin@sphincs.local",
          roles: ["Admin"],
          organizationId: "org1"
        }
      })
    );
    vi.spyOn(ApiClient.prototype, "authorized").mockRejectedValue(
      new AuthSessionExpiredError("Your session expired. Please sign in again.")
    );

    render(<RootApp />);

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Sign in once for ERP + CRM" })).toBeInTheDocument()
    );
    expect(localStorage.getItem("sphincs.session")).toBeNull();
  });
});
