import { Module } from "@nestjs/common";
import { QuizController } from "./quiz.controller";
import { QuizService } from "./quiz.service";
import { CertificateController } from "./certificate.controller";
import { CertificateService } from "./certificate.service";

@Module({
  controllers: [QuizController, CertificateController],
  providers: [QuizService, CertificateService],
})
export class QuizModule {}
