import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function doc(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

// Placeholder clip URLs (horizontal .mp4 — fine for demo). In production these
// can be YouTube links or Bunny Stream embeds; the feed player handles both.
const CLIP_URLS = [
  "https://assets.mixkit.co/videos/preview/mixkit-woman-taking-notes-on-a-sheet-4075-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-young-woman-studying-online-4076-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-an-office-4279-large.mp4",
];

async function main() {
  // Demo instructor. In production this id comes from a real Supabase user.
  const instructor = await prisma.profile.upsert({
    where: { id: "demo-instructor" },
    update: {},
    create: {
      id: "demo-instructor",
      email: "instructor@example.com",
      displayName: "ครูเดโม",
      role: "INSTRUCTOR",
    },
  });

  // Demo student (used by the dev-login "นักเรียน" button).
  await prisma.profile.upsert({
    where: { id: "demo-student" },
    update: {},
    create: {
      id: "demo-student",
      email: "student@demo.local",
      displayName: "นักเรียนเดโม",
      role: "STUDENT",
    },
  });

  // ---- Class 1: พื้นฐานการพัฒนาเว็บ ----
  const webSections = [
    {
      title: "คลิปทั้งหมด",
      order: 0,
      lessons: {
        create: [
          {
            title: "เว็บทำงานอย่างไร",
            order: 0,
            type: "VIDEO" as const,
            caption: "อินเทอร์เน็ตกับเบราว์เซอร์ทำงานร่วมกันยังไง สรุปใน 1 คลิป",
            durationSeconds: 40,
            videoUrl: CLIP_URLS[0],
            contentJson: doc("") as never,
          },
          {
            title: "โครงสร้าง HTML เบื้องต้น",
            order: 1,
            type: "VIDEO" as const,
            caption: "รู้จักแท็ก HTML พื้นฐาน จัดโครงสร้างหน้าเว็บในไม่กี่วินาที",
            durationSeconds: 50,
            videoUrl: CLIP_URLS[1],
            contentJson: doc("") as never,
          },
          {
            title: "Selector และ Property",
            order: 2,
            type: "VIDEO" as const,
            caption: "เลือก element และกำหนดสไตล์ด้วย CSS แบบเข้าใจง่าย",
            durationSeconds: 45,
            videoUrl: CLIP_URLS[2],
            contentJson: doc("") as never,
          },
          {
            title: "JavaScript เบื้องต้น",
            order: 3,
            type: "VIDEO" as const,
            caption: "ทำไมเว็บถึงต้องมี JavaScript และมันช่วยให้เว็บเป็นอย่างไร",
            durationSeconds: 55,
            videoUrl: CLIP_URLS[3],
            contentJson: doc("") as never,
          },
        ],
      },
    },
  ];

  const webCourse = await prisma.course.upsert({
    where: { slug: "intro-web-dev" },
    update: {
      title: "พื้นฐานการพัฒนาเว็บ",
      description: "เรียนรู้ HTML, CSS และ JavaScript ผ่านคลิปการสอนสั้น เข้าใจง่าย เห็นภาพชัด",
      sections: { deleteMany: {}, create: webSections },
    },
    create: {
      slug: "intro-web-dev",
      title: "พื้นฐานการพัฒนาเว็บ",
      description: "เรียนรู้ HTML, CSS และ JavaScript ผ่านคลิปการสอนสั้น เข้าใจง่าย เห็นภาพชัด",
      status: "PUBLISHED",
      instructorId: instructor.id,
      sections: { create: webSections },
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: "demo-student", courseId: webCourse.id } },
    update: {},
    create: { userId: "demo-student", courseId: webCourse.id },
  });

  // End-of-class quiz (keeps the quiz + certificate feature demonstrable).
  const webQuiz = await prisma.quiz.upsert({
    where: { courseId: webCourse.id },
    update: {},
    create: {
      courseId: webCourse.id,
      title: "แบบทดสอบท้ายคลาส",
      passingScore: 60,
    },
  });
  const webQuestions = await prisma.question.count({ where: { quizId: webQuiz.id } });
  if (webQuestions === 0) {
    await prisma.question.createMany({
      data: [
        {
          quizId: webQuiz.id,
          text: "HTML ย่อมาจากอะไร",
          options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language"],
          correctIndex: 0,
          order: 0,
        },
        {
          quizId: webQuiz.id,
          text: "แท็กใดใช้สร้างลิงก์",
          options: ["<link>", "<a>", "<href>"],
          correctIndex: 1,
          order: 1,
        },
        {
          quizId: webQuiz.id,
          text: "CSS ใช้ทำอะไร",
          options: ["จัดการฐานข้อมูล", "กำหนดสไตล์หน้าเว็บ", "เขียนตรรกะโปรแกรม"],
          correctIndex: 1,
          order: 2,
        },
      ],
    });
  }

  console.log(`Seeded class: ${webCourse.slug} (+ demo-student, quiz)`);

  // ---- Class 2: TikTok Marketing 101 ----
  const tiktokSections = [
    {
      title: "คลิปทั้งหมด",
      order: 0,
      lessons: {
        create: [
          {
            title: "ทำไมต้องขายของบน TikTok",
            order: 0,
            type: "VIDEO" as const,
            caption: "3 เหตุผลที่ TikTok คือช่องทางขายของที่ร้อนแรงที่สุดตอนนี้",
            durationSeconds: 45,
            videoUrl: CLIP_URLS[0],
            contentJson: doc("") as never,
          },
          {
            title: "Hook 3 วินาทีแรก",
            order: 1,
            type: "VIDEO" as const,
            caption: "เทคนิคดึงดูดความสนใจใน 3 วินาทีแรกของคลิป",
            durationSeconds: 60,
            videoUrl: CLIP_URLS[1],
            contentJson: doc("") as never,
          },
          {
            title: "สร้าง Content Calendar",
            order: 2,
            type: "VIDEO" as const,
            caption: "วางแผนโพสต์ 7 วันล่วงหน้า ไม่ต้องคิดทุกวัน",
            durationSeconds: 55,
            videoUrl: CLIP_URLS[2],
            contentJson: doc("") as never,
          },
          {
            title: "Live + TikTok Shop",
            order: 3,
            type: "VIDEO" as const,
            caption: "ผสม Live กับ TikTok Shop ยอดขายพุ่ง",
            durationSeconds: 50,
            videoUrl: CLIP_URLS[3],
            contentJson: doc("") as never,
          },
        ],
      },
    },
  ];

  const tiktokCourse = await prisma.course.upsert({
    where: { slug: "tiktok-marketing-101" },
    update: {
      title: "TikTok Marketing 101",
      description: "เรียนการตลาดบน TikTok แบบคลิปสั้น กระชับ เข้าใจง่าย",
      sections: { deleteMany: {}, create: tiktokSections },
    },
    create: {
      slug: "tiktok-marketing-101",
      title: "TikTok Marketing 101",
      description: "เรียนการตลาดบน TikTok แบบคลิปสั้น กระชับ เข้าใจง่าย",
      status: "PUBLISHED",
      instructorId: instructor.id,
      sections: { create: tiktokSections },
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: "demo-student", courseId: tiktokCourse.id } },
    update: {},
    create: { userId: "demo-student", courseId: tiktokCourse.id },
  });

  console.log(`Seeded class: ${tiktokCourse.slug}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
