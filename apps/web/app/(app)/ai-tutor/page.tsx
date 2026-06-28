"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, BookOpen, Send, Sparkles, User, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "model";
  text: string;
}

const quickPrompts = [
  "สรุปบทนี้ให้หน่อย",
  "อธิบายแบบเด็ก 10 ขวบ",
  "สร้าง Quiz จากบทนี้",
  "สร้าง Mindmap",
  "ทำข้อสอบจำลอง",
  "วิเคราะห์คู่แข่ง",
];

export default function AiTutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonContext, setLessonContext] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = sessionStorage.getItem("np_lesson_context");
    if (ctx) setLessonContext(ctx);
  }, []);

  function clearContext() {
    sessionStorage.removeItem("np_lesson_context");
    setLessonContext(null);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const next: Message[] = [...messages, { role: "user", text: content }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await api.post<{ text: string }>(
        "/ai/chat",
        { messages: next, lessonContext: lessonContext ?? undefined },
        false,
      );
      setMessages((m) => [...m, { role: "model", text: res.text }]);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "เชื่อมต่อ AI ไม่สำเร็จ";
      setError(msg);
      setMessages((m) => [
        ...m,
        { role: "model", text: `⚠️ ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-ink">
          <Bot size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-ink">AI Tutor</h1>
          <p className="text-sm text-slate-500">NP Tutor · ถามอะไรก็ได้เกี่ยวกับบทเรียน</p>
        </div>
      </div>

      {lessonContext && (
        <div className="flex items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
          <BookOpen size={16} className="shrink-0" />
          <span className="flex-1 truncate">
            กำลังถามโดยอ้างอิงเนื้อหาบทเรียนที่เลือก
          </span>
          <button
            onClick={clearContext}
            className="rounded-full p-1 hover:bg-brand-100"
            aria-label="ล้างบริบทบทเรียน"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="flex h-[70vh] flex-col rounded-3xl bg-white shadow-sm">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Sparkles size={26} />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">สวัสดีครับ ผม NP Tutor</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                ถามอะไรก็ได้เกี่ยวกับบทเรียน หรือเลือกคำสั่งด่วนด้านล่างเพื่อเริ่มต้น
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    m.role === "user" ? "bg-brand-700 text-white" : "bg-ink text-gold-400",
                  )}
                >
                  {m.role === "user" ? <User size={16} /> : <Bot size={16} />}
                </span>
                <div
                  className={cn(
                    "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-tr-sm bg-brand-600 text-white"
                      : "rounded-tl-sm bg-slate-100 text-slate-800",
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-gold-400">
                <Bot size={16} />
              </span>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-3">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              disabled={loading}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-slate-100 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์คำถาม..."
            className="h-11 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-gold-400 transition hover:bg-ink-800 disabled:opacity-40"
            aria-label="ส่ง"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {error && (
        <p className="text-center text-xs text-slate-400">
          เคล็ดลับ: ถ้าใช้งานไม่ได้ ตรวจว่าตั้งค่า GEMINI_API_KEY และรัน API แล้วหรือยัง
        </p>
      )}
    </div>
  );
}

function Dot({ delay = "0ms" }: { delay?: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
