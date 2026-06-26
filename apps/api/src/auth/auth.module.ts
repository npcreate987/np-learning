import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { AuthController } from "./auth.controller";
import { DevAuthController } from "./dev-auth.controller";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "jwt" })],
  controllers: [AuthController, DevAuthController],
  providers: [JwtStrategy],
  exports: [PassportModule],
})
export class AuthModule {}
