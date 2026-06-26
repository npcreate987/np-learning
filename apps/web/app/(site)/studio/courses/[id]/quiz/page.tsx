"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Save, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/components/auth-provider";
import { Button, Card, Input, Label } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  order: number;
}
interface ManageQuiz {
  id: string;
  title: string;
  passingScore: number;
  questions: Question[];
}

export default function QuizManagePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [quiz, setQuiz] = useState<ManageQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [passingScore, setPassingScore] = useState(70);

  // new question buffer
  const [qText, setQText] = useState("");
  const [qOptions, setQOptions] = useState<string[]>(["", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [adding, setAdding] = useState(false);

  const reload = useCallback(async () => {
    const q = await api.get<ManageQuiz | null>(`/quizzes/manage/${id}`, true);
    setQuiz(q);
    if (q) {
      setTitle(q.title);
      setPassingScore(q.passingScore);
    }
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      router.push("/login");
      return;
    }
    reload()
      .catch((e) => {
        if (e instanceof ApiError) alert(e.message);
        router.push(`/studio/courses/${id}`);
      })
      .finally(() => setLoading(false));
  }, [session, authLoading, reload, router, id]);

  async function createQuiz() {
    await api.post("/quizzes", { courseId: id });
    await reload();
  }

  async function saveSettings() {
    if (!quiz) return;
    await api.patch(`/quizzes/${quiz.id}`, { title, passingScore });
    await reload();
  }

  async function addQuestion() {
    if (!quiz) return;
    const options = qOptions.map((o) => o.trim()).filter(Boolean);
    if (!qText.trim() || options.length < 2) {
      alert("กรุณากรอกคำถามและตัวเลือกอย่างน้อย 2 ตัว");
      return;
    }
    if (qCorrect >= options.length) {
      alert("กรุณาเลือกคำตอบที่ถูกต้องให้อยู่ในตัวเลือกที่กรอก");
      return;
    }
    setAdding(true);
    try {
      await api.post(`/quizzes/${quiz.id}/questions`, {
        text: qText.trim(),
        options,
        correctIndex: qCorrect,
      });
      setQText("");
      setQOptions(["", ""]);
      setQCorrect(0);
      await reload();
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function deleteQuestion(questionId: string) {
    if (!confirm("ลบคำถามนี้?")) return;
    await api.del(`/quizzes/questions/${questionId}`);
    await reload();
  }

  if (authLoading || loading) {
    return <div className="h-96 animate-pulse rounded-xl bg-slate-200" />;
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Link
        href={`/studio/courses/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft size={16} /> กลับไปแก้ไขคอร์ส
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">แบบทดสอบท้ายคอร์ส</h1>

      {!quiz ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-slate-500">คอร์สนี้ยังไม่มีแบบทดสอบ</p>
          <Button className="mt-4" onClick={createQuiz}>
            <Plus size={16} /> สร้างแบบทดสอบ
          </Button>
        </Card>
      ) : (
        <>
          <Card className="mt-6 p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <div>
                <Label>ชื่อแบบทดสอบ</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label>เกณฑ์ผ่าน (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                />
              </div>
            </div>
            <Button className="mt-3" size="sm" onClick={saveSettings}>
              <Save size={15} /> บันทึกการตั้งค่า
            </Button>
          </Card>

          <div className="mt-6 space-y-3">
            <h2 className="font-semibold text-slate-900">
              คำถาม ({quiz.questions.length})
            </h2>
            {quiz.questions.map((q, idx) => (
              <Card key={q.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-slate-800">
                    {idx + 1}. {q.text}
                  </p>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="ลบคำถาม"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {q.options.map((opt, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-2",
                        i === q.correctIndex ? "font-medium text-green-700" : "text-slate-600",
                      )}
                    >
                      {i === q.correctIndex ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <span className="inline-block w-3.5" />
                      )}
                      {opt}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
            {quiz.questions.length === 0 && (
              <p className="text-sm text-slate-400">ยังไม่มีคำถาม เพิ่มคำถามแรกด้านล่าง</p>
            )}
          </div>

          {/* Add question */}
          <Card className="mt-6 p-5">
            <h3 className="font-semibold text-slate-900">เพิ่มคำถามใหม่</h3>
            <div className="mt-3 space-y-3">
              <div>
                <Label>คำถาม</Label>
                <Input
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="พิมพ์คำถาม..."
                />
              </div>
              <div>
                <Label>ตัวเลือก (เลือกวงกลมหน้าข้อที่ถูก)</Label>
                <div className="space-y-2">
                  {qOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correct"
                        checked={qCorrect === i}
                        onChange={() => setQCorrect(i)}
                        className="accent-green-600"
                        aria-label={`ตัวเลือกที่ถูก ${i + 1}`}
                      />
                      <Input
                        value={opt}
                        onChange={(e) =>
                          setQOptions((o) => o.map((v, j) => (j === i ? e.target.value : v)))
                        }
                        placeholder={`ตัวเลือกที่ ${i + 1}`}
                      />
                      {qOptions.length > 2 && (
                        <button
                          onClick={() => {
                            setQOptions((o) => o.filter((_, j) => j !== i));
                            setQCorrect((c) => (c >= i && c > 0 ? c - 1 : c));
                          }}
                          className="text-slate-400 hover:text-red-600"
                          aria-label="ลบตัวเลือก"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {qOptions.length < 6 && (
                  <button
                    onClick={() => setQOptions((o) => [...o, ""])}
                    className="mt-2 flex items-center gap-1 text-sm text-brand-600 hover:underline"
                  >
                    <Plus size={14} /> เพิ่มตัวเลือก
                  </button>
                )}
              </div>
              <Button onClick={addQuestion} disabled={adding}>
                <Plus size={16} /> {adding ? "กำลังเพิ่ม..." : "เพิ่มคำถาม"}
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
