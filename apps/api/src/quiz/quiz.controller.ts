import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt.strategy";
import { QuizService } from "./quiz.service";

class CreateQuizDto {
  @IsString()
  courseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;
}

class UpdateQuizDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passingScore?: number;
}

class QuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  options!: string[];

  @IsInt()
  @Min(0)
  correctIndex!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

class AnswerDto {
  @IsString()
  questionId!: string;

  @IsInt()
  @Min(0)
  choiceIndex!: number;
}

class SubmitDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}

@Controller("quizzes")
export class QuizController {
  constructor(private readonly quiz: QuizService) {}

  @Get("course/:courseId")
  @UseGuards(JwtAuthGuard)
  getForCourse(@CurrentUser() user: AuthUser, @Param("courseId") courseId: string) {
    return this.quiz.getForCourse(user, courseId);
  }

  @Get("manage/:courseId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  getManage(@CurrentUser() user: AuthUser, @Param("courseId") courseId: string) {
    return this.quiz.getManageByCourse(user, courseId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateQuizDto) {
    return this.quiz.createForCourse(user, dto.courseId, dto.title, dto.passingScore);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quiz.updateQuiz(user, id, dto);
  }

  @Post(":id/questions")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  addQuestion(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: QuestionDto,
  ) {
    return this.quiz.addQuestion(user, id, dto);
  }

  @Patch("questions/:questionId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  updateQuestion(
    @CurrentUser() user: AuthUser,
    @Param("questionId") questionId: string,
    @Body() dto: QuestionDto,
  ) {
    return this.quiz.updateQuestion(user, questionId, dto);
  }

  @Delete("questions/:questionId")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("INSTRUCTOR")
  deleteQuestion(
    @CurrentUser() user: AuthUser,
    @Param("questionId") questionId: string,
  ) {
    return this.quiz.deleteQuestion(user, questionId);
  }

  @Post(":id/submit")
  @UseGuards(JwtAuthGuard)
  submit(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: SubmitDto,
  ) {
    return this.quiz.submit(user, id, dto.answers);
  }
}
