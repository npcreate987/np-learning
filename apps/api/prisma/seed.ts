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

  const course = await prisma.course.upsert({
    where: { slug: "intro-web-dev" },
    update: {},
    create: {
      slug: "intro-web-dev",
      title: "พื้นฐานการพัฒนาเว็บ",
      description: "เรียนรู้ HTML, CSS และ JavaScript ตั้งแต่เริ่มต้นจนสร้างเว็บได้จริง",
      status: "PUBLISHED",
      instructorId: instructor.id,
      sections: {
        create: [
          {
            title: "เริ่มต้นกับเว็บ",
            order: 0,
            lessons: {
              create: [
                {
                  title: "เว็บทำงานอย่างไร",
                  order: 0,
                  type: "TEXT",
                  contentJson: doc("อินเทอร์เน็ตและเว็บเบราว์เซอร์ทำงานร่วมกันอย่างไร") as any,
                },
                {
                  title: "โครงสร้าง HTML เบื้องต้น",
                  order: 1,
                  type: "TEXT",
                  contentJson: doc("รู้จักแท็ก HTML พื้นฐานและการจัดโครงสร้างหน้าเว็บ") as any,
                },
              ],
            },
          },
          {
            title: "จัดสไตล์ด้วย CSS",
            order: 1,
            lessons: {
              create: [
                {
                  title: "Selector และ Property",
                  order: 0,
                  type: "TEXT",
                  contentJson: doc("เลือก element และกำหนดสไตล์ด้วย CSS") as any,
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Demo student (used by the dev-login "นักเรียน" button) enrolled in the course.
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
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: "demo-student", courseId: course.id } },
    update: {},
    create: { userId: "demo-student", courseId: course.id },
  });

  // Attach a sample video to the first lesson.
  const firstLesson = await prisma.lesson.findFirst({
    where: { section: { courseId: course.id } },
    orderBy: { order: "asc" },
  });
  if (firstLesson && !firstLesson.videoUrl) {
    await prisma.lesson.update({
      where: { id: firstLesson.id },
      data: {
        type: "VIDEO",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
    });
  }

  // End-of-course quiz with a few questions.
  const quiz = await prisma.quiz.upsert({
    where: { courseId: course.id },
    update: {},
    create: {
      courseId: course.id,
      title: "แบบทดสอบท้ายคอร์ส",
      passingScore: 60,
    },
  });
  const existingQuestions = await prisma.question.count({ where: { quizId: quiz.id } });
  if (existingQuestions === 0) {
    await prisma.question.createMany({
      data: [
        {
          quizId: quiz.id,
          text: "HTML ย่อมาจากอะไร",
          options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language"],
          correctIndex: 0,
          order: 0,
        },
        {
          quizId: quiz.id,
          text: "แท็กใดใช้สร้างลิงก์",
          options: ["<link>", "<a>", "<href>"],
          correctIndex: 1,
          order: 1,
        },
        {
          quizId: quiz.id,
          text: "CSS ใช้ทำอะไร",
          options: ["จัดการฐานข้อมูล", "กำหนดสไตล์หน้าเว็บ", "เขียนตรรกะโปรแกรม"],
          correctIndex: 1,
          order: 2,
        },
      ],
    });
  }

  console.log(`Seeded course: ${course.slug} (+ demo-student, quiz, video)`);

  // TikTok-style short class
  const tiktokCourse = await prisma.course.upsert({
    where: { slug: "tiktok-marketing-101" },
    update: { format: "TIKTOK" },
    create: {
      slug: "tiktok-marketing-101",
      title: "TikTok Marketing 101",
      description: "เรียนการตลาดบน TikTok แบบคลิปสั้น กระชับ เข้าใจง่าย",
      status: "PUBLISHED",
      format: "TIKTOK",
      instructorId: instructor.id,
      sections: {
        create: [
          {
            title: "คลิปทั้งหมด",
            order: 0,
            lessons: {
              create: [
                {
                  title: "ทำไมต้องขายของบน TikTok",
                  order: 0,
                  type: "VIDEO",
                  caption: "3 เหตุผลที่ TikTok คือช่องทางขายของที่ร้อนแรงที่สุดตอนนี้",
                  durationSeconds: 45,
                  videoUrl:
                    "https://assets.mixkit.co/videos/preview/mixkit-woman-taking-notes-on-a-sheet-4075-large.mp4",
                  contentJson: doc("") as any,
                },
                {
                  title: "Hook 3 วินาทีแรก",
                  order: 1,
                  type: "VIDEO",
                  caption: "เทคนิคดึงดูดความสนใจใน 3 วินาทีแรกของคลิป",
                  durationSeconds: 60,
                  videoUrl:
                    "https://assets.mixkit.co/videos/preview/mixkit-young-woman-studying-online-4076-large.mp4",
                  contentJson: doc("") as any,
                },
                {
                  title: "สร้าง Content Calendar",
                  order: 2,
                  type: "VIDEO",
                  caption: "วางแผนโพสต์ 7 วันล่วงหน้า ไม่ต้องคิดทุกวัน",
                  durationSeconds: 55,
                  videoUrl:
                    "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4",
                  contentJson: doc("") as any,
                },
                {
                  title: "Live + TikTok Shop",
                  order: 3,
                  type: "VIDEO",
                  caption: "ผสม Live กับ TikTok Shop ยอดขายพุ่ง",
                  durationSeconds: 50,
                  videoUrl:
                    "https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-an-office-4279-large.mp4",
                  contentJson: doc("") as any,
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: "demo-student", courseId: tiktokCourse.id } },
    update: {},
    create: { userId: "demo-student", courseId: tiktokCourse.id },
  });

  console.log(`Seeded TikTok class: ${tiktokCourse.slug}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
