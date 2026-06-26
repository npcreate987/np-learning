import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CoursesModule } from "./courses/courses.module";
import { SectionsModule } from "./sections/sections.module";
import { LessonsModule } from "./lessons/lessons.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { ProgressModule } from "./progress/progress.module";
import { UploadsModule } from "./uploads/uploads.module";
import { AiModule } from "./ai/ai.module";
import { CommunityModule } from "./community/community.module";
import { QuizModule } from "./quiz/quiz.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CoursesModule,
    SectionsModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    UploadsModule,
    AiModule,
    CommunityModule,
    QuizModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
