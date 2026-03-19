import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ResetRateLimitDto } from "./dto/reset-rate-limit.dto";
import { SignupDto } from "./dto/signup.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Req } from "@nestjs/common";
import { Request } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getClientFingerprint(req: Request): string {
    const forwarded = req.headers["x-forwarded-for"];
    const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = forwardedValue?.split(",")[0].trim() || req.ip || "unknown";
    return ip;
  }

  @Post("login")
  login(@Body() body: LoginDto, @Req() req: Request) {
    return this.authService.login(body.email, body.password, this.getClientFingerprint(req));
  }

  @Post("signup")
  signup(@Body() body: SignupDto, @Req() req: Request) {
    return this.authService.signup(body.email, body.password, this.getClientFingerprint(req));
  }

  @Post("refresh")
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post("rate-limit/reset")
  @Roles("Admin")
  resetRateLimit(@Body() body: ResetRateLimitDto) {
    return this.authService.resetLoginRateLimit(body.email);
  }

  @Get("me")
  @Roles("Admin", "ERP Manager", "CRM Manager", "Staff")
  me(@Req() req: { user?: { id: string } }) {
    return this.authService.me(req.user?.id ?? "");
  }
}
