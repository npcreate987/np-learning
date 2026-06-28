import { Module } from "@nestjs/common";
import { LearningInterestController } from "./learning-interest.controller";
import { LearningInterestService } from "./learning-interest.service";

@Module({
  controllers: [LearningInterestController],
  providers: [LearningInterestService],
})
export class LearningInterestModule {}
