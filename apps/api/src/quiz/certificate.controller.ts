import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { CertificateService } from "./certificate.service";

@Controller("certificates")
export class CertificateController {
  constructor(private readonly certificates: CertificateService) {}

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  listMine(@CurrentUser() user: AuthUser) {
    return this.certificates.listMine(user.id);
  }

  // Public — used for the printable / verifiable certificate page.
  @Get(":serial")
  getBySerial(@Param("serial") serial: string) {
    return this.certificates.getBySerial(serial);
  }
}
