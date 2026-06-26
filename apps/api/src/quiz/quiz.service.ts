import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthUser } from "../auth/jwt.strategy";
import { CertificateService } from "./certificate.service";

interface QuestionInput {
  text: string;
  options: string[];
  correctIndex: number;
  order?: number;
}

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly certificates: CertificateService,
  ) {}

  // ---- Instructor ----

  async createForCourse(
    user: AuthUser,
    courseId: string,
    title?: string,
    passingScore?: number,
  ) {
    await this.assertCourseOwner(courseId, user);
    const existing = await this.prisma.quiz.findUnique({ where: { courseId } });
    if (existing) return existing;
    return this.prisma.quiz.create({
      data: { courseId, title, passingScore },
    });
  }

  async getManageByCourse(user: AuthUser, courseId: string) {
    await this.assertCourseOwner(courseId, user);
    return this.prisma.quiz.findUnique({
      where: { courseId },
      include: { questions: { orderBy: { order: "asc" } } },
    });
  }

  async updateQuiz(
    user: AuthUser,
    quizId: string,
    data: { title?: string; passingScore?: number },
  ) {
    await this.assertQuizOwner(quizId, user);
    return this.prisma.quiz.update({ where: { id: quizId }, data });
  }

  async addQuestion(user: AuthUser, quizId: string, input: QuestionInput) {
    await this.assertQuizOwner(quizId, user);
    const order =
      input.order ?? (await this.prisma.question.count({ where: { quizId } }));
    return this.prisma.question.create({
      data: {
        quizId,
        text: input.text,
        options: input.options,
        correctIndex: input.correctIndex,
        order,
      },
    });
  }

  async updateQuestion(
    user: AuthUser,
    questionId: string,
    input: Partial<QuestionInput>,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });
    if (!question) throw new NotFoundException("ไม่พบคำถาม");
    await this.assertQuizOwner(question.quizId, user);
    return this.prisma.question.update({
      where: { id: questionId },
      data: {
        text: input.text,
        options: input.options,
        correctIndex: input.correctIndex,
        order: input.order,
      },
    });
  }

  async deleteQuestion(user: AuthUser, questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      select: { quizId: true },
    });
    if (!question) throw new NotFoundException("ไม่พบคำถาม");
    await this.assertQuizOwner(question.quizId, user);
    await this.prisma.question.delete({ where: { id: questionId } });
    return { ok: true };
  }

  // ---- Student ----

  /** Quiz for taking: questions without the correct answer. */
  async getForCourse(user: AuthUser, courseId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { courseId },
      include: {
        questions: { orderBy: { order: "asc" } },
        course: { select: { instructorId: true, title: true } },
      },
    });
    if (!quiz) return null;

    const isOwner =
      quiz.course.instructorId === user.id || user.role === "ADMIN";
    if (!isOwner) {
      const enrolled = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId } },
      });
      if (!enrolled) {
        throw new ForbiddenException("ต้องลงทะเบียนเรียนก่อนทำแบบทดสอบ");
      }
    }

    return {
      id: quiz.id,
      title: quiz.title,
      passingScore: quiz.passingScore,
      courseTitle: quiz.course.title,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options as string[],
      })),
    };
  }

  async submit(
    user: AuthUser,
    quizId: string,
    answers: { questionId: string; choiceIndex: number }[],
  ) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        course: { select: { id: true, instructorId: true } },
      },
    });
    if (!quiz) throw new NotFoundException("ไม่พบแบบทดสอบ");

    const isOwner =
      quiz.course.instructorId === user.id || user.role === "ADMIN";
    if (!isOwner) {
      const enrolled = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: quiz.courseId } },
      });
      if (!enrolled) {
        throw new ForbiddenException("ต้องลงทะเบียนเรียนก่อนทำแบบทดสอบ");
      }
    }

    const answerMap = new Map(answers.map((a) => [a.questionId, a.choiceIndex]));
    const total = quiz.questions.length;
    let correct = 0;
    for (const q of quiz.questions) {
      if (answerMap.get(q.id) === q.correctIndex) correct++;
    }
    const score = total ? Math.round((correct / total) * 100) : 0;
    const passed = total > 0 && score >= quiz.passingScore;

    await this.prisma.quizAttempt.create({
      data: { quizId, userId: user.id, score, passed },
    });

    let certificateSerial: string | undefined;
    if (passed) {
      const cert = await this.certificates.issue(user.id, quiz.courseId);
      certificateSerial = cert.serial;
    }

    return {
      score,
      correct,
      total,
      passed,
      passingScore: quiz.passingScore,
      certificateSerial,
    };
  }

  // ---- Helpers ----

  private async assertCourseOwner(courseId: string, user: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });
    if (!course) throw new NotFoundException("ไม่พบคอร์ส");
    if (course.instructorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("ไม่ใช่เจ้าของคอร์ส");
    }
  }

  private async assertQuizOwner(quizId: string, user: AuthUser) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { course: { select: { instructorId: true } } },
    });
    if (!quiz) throw new NotFoundException("ไม่พบแบบทดสอบ");
    if (quiz.course.instructorId !== user.id && user.role !== "ADMIN") {
      throw new ForbiddenException("ไม่ใช่เจ้าของคอร์ส");
    }
  }
}
