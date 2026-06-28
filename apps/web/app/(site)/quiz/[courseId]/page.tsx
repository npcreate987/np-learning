"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Award, CheckCircle2, FileQuestion, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Quiz {
  id: string;
  title: string;
  passingScore: number;
  courseTitle: string;
  questions: { id: string; text: string; options: string[] }[];
}

interface Result {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  passingScore: number;
  certificateSerial?: string;
}

export default function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    api
      .get<Quiz | null>(`/quizzes/course/${courseId}`, true)
      .then(setQuiz)
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [courseId, session, authLoading, router]);

  async function submit() {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(answers).map(([questionId, choiceIndex]) => ({
          questionId,
          choiceIndex,
        })),
      };
      const res = await api.post<Result>(`/quizzes/${quiz.id}/submit`, payload, true);
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "ส่งคำตอบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return <div className="h-72 animate-pulse rounded-xl bg-slate-200" />;
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
        <FileQuestion className="mx-auto text-slate-300" size={40} />
        <h1 className="mt-3 text-lg font-bold text-slate-900">ยังไม่มีแบบทดสอบ</h1>
        <p className="mt-1 text-sm text-slate-500">คลาสนี้ยังไม่ได้สร้างแบบทดสอบท้ายคลาส</p>
      </Card>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <Card className="p-8 text-center">
          {result.passed ? (
            <CheckCircle2 className="mx-auto text-green-500" size={56} />
          ) : (
            <XCircle className="mx-auto text-red-400" size={56} />
          )}
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {result.passed ? "ยินดีด้วย! คุณสอบผ่าน" : "ยังไม่ผ่าน ลองอีกครั้งนะ"}
          </h1>
          <p className="mt-2 text-slate-600">
            ได้ {result.correct}/{result.total} ข้อ · คะแนน{" "}
            <span className="font-bold text-ink">{result.score}%</span>
            <span className="text-slate-400"> (เกณฑ์ผ่าน {result.passingScore}%)</span>
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {result.passed && result.certificateSerial && (
              <Link href={`/certificate/${result.certificateSerial}`}>
                <Button>
                  <Award size={18} /> ดูใบประกาศนียบัตร
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              ทำแบบทดสอบอีกครั้ง
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const allAnswered = quiz.questions.every((q) => answers[q.id] !== undefined);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {quiz.courseTitle} · {quiz.questions.length} ข้อ · เกณฑ์ผ่าน {quiz.passingScore}%
      </p>

      <div className="mt-6 space-y-5">
        {quiz.questions.map((q, idx) => (
          <Card key={q.id} className="p-5">
            <p className="font-medium text-slate-900">
              {idx + 1}. {q.text}
            </p>
            <div className="mt-3 space-y-2">
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition",
                    answers[q.id] === i
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === i}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className="accent-brand-600"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          ตอบแล้ว {Object.keys(answers).length}/{quiz.questions.length}
        </p>
        <Button onClick={submit} disabled={!allAnswered || submitting}>
          {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
        </Button>
      </div>
    </div>
  );
}
