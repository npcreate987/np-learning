import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const MODEL = "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  /**
   * Sends a multi-turn conversation to Gemini and returns the assistant text.
   * `lessonContext` (optional) is injected into the system instruction so the
   * tutor can answer about the current lesson.
   */
  async chat(messages: ChatMessage[], lessonContext?: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        "AI ยังไม่ถูกตั้งค่า (ตั้งค่า GEMINI_API_KEY ใน apps/api/.env)",
      );
    }

    const systemText = [
      "คุณคือ 'NP Tutor' ผู้ช่วยติวเตอร์ AI ของแพลตฟอร์มเรียนออนไลน์ NP Learning",
      "ตอบเป็นภาษาไทยที่เข้าใจง่าย กระชับ เป็นกันเอง และให้กำลังใจผู้เรียน",
      "ถ้าผู้เรียนขอ Quiz ให้สร้างคำถามพร้อมเฉลย ถ้าขอ Mindmap ให้ตอบเป็นโครงร่างแบบ bullet",
      lessonContext ? `บริบทบทเรียนปัจจุบัน:\n${lessonContext}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const body = {
      systemInstruction: { parts: [{ text: systemText }] },
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    let res: Response;
    try {
      res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      this.logger.error("Gemini request failed", e as Error);
      throw new BadGatewayException("เชื่อมต่อ AI ไม่สำเร็จ");
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      this.logger.error(`Gemini error ${res.status}: ${detail}`);
      throw new BadGatewayException("AI ตอบกลับผิดพลาด กรุณาลองใหม่");
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };

    if (data.promptFeedback?.blockReason) {
      return "ขออภัย ไม่สามารถตอบคำถามนี้ได้ ลองถามใหม่ในรูปแบบอื่นนะครับ";
    }

    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();

    return text || "ขออภัย ยังไม่มีคำตอบ ลองถามใหม่อีกครั้งนะครับ";
  }
}
