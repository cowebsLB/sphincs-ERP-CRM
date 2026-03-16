import { Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";

@Injectable()
export class AuthService {
  private readonly secret = process.env.JWT_SECRET ?? "change-me";

  login(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException("Invalid credentials");
    }
    const payload = {
      sub: "seed-user-id",
      email,
      roles: ["Admin"],
      organizationId: "seed-org-id"
    };
    const accessToken = jwt.sign(payload, this.secret, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ sub: payload.sub }, this.secret, {
      expiresIn: "7d"
    });
    return { accessToken, refreshToken, tokenType: "Bearer" };
  }

  refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, this.secret) as { sub: string };
      const accessToken = jwt.sign({ sub: decoded.sub, roles: ["Admin"] }, this.secret, {
        expiresIn: "1h"
      });
      return { accessToken, tokenType: "Bearer" };
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  me() {
    return {
      id: "seed-user-id",
      email: "admin@example.com",
      roles: ["Admin"],
      organizationId: "seed-org-id"
    };
  }
}

