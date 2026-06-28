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
import { LearningInterestModule } from "./learning-interest/learning-interest.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { DeviceTokensModule } from "./device-tokens/device-tokens.module";
import { ReferralModule } from "./referral/referral.module";
import { AdminModule } from "./admin/admin.module";
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
    LearningInterestModule,
    NotificationsModule,
    DeviceTokensModule,
    ReferralModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
