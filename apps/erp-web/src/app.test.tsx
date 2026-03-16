import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, beforeEach, it, expect, vi, afterEach } from "vitest";
import { RootApp } from "./app";
import { ApiClient } from "@sphincs/api-client";

describe("ERP RootApp", () => {
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
    expect(screen.getByRole("heading", { name: "ERP Login" })).toBeInTheDocument();
  });

  it("logs in and shows ERP shell", async () => {
    vi.spyOn(ApiClient.prototype, "login").mockResolvedValue({
      accessToken: "access",
      refreshToken: "refresh",
      tokenType: "Bearer"
    });
    vi.spyOn(ApiClient.prototype, "authorized").mockImplementation(async (path, tokens) => {
      if (path === "/auth/me") {
        return {
          data: {
            id: "u1",
            email: "admin@sphincs.local",
            roles: ["Admin"],
            organizationId: "org1"
          },
          tokens
        };
      }
      return { data: [], tokens };
    });

    render(<RootApp />);
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "SPHINCS ERP" })).toBeInTheDocument()
    );
  });

  it("blocks non-erp roles", async () => {
    localStorage.setItem(
      "sphincs.erp.session",
      JSON.stringify({
        accessToken: "a",
        refreshToken: "r",
        user: {
          id: "u1",
          email: "staff@sphincs.local",
          roles: ["Staff"],
          organizationId: "org1"
        }
      })
    );
    render(<RootApp />);
    expect(screen.getByText("Your account does not have ERP access.")).toBeInTheDocument();
  });
});
