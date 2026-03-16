import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { Req } from "@nestjs/common";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Post("refresh")
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Get("me")
  @Roles("Admin", "ERP Manager", "CRM Manager", "Staff")
  me(@Req() req: { user?: { id: string } }) {
    return this.authService.me(req.user?.id ?? "");
  }
}
