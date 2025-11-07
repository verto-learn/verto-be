import { PrismaClient, CourseDifficulty, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';


const prisma = new PrismaClient();


async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function main() {
  console.log(`Start seeding ...`);
  const hashedPassword = await hashPassword('password123');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      full_name: 'Admin User',
      password: hashedPassword,
      role: UserRole.admin,
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      full_name: 'Regular User',
      password: hashedPassword,
      role: UserRole.user,
    },
  });

  console.log(`Created users: ${adminUser.full_name}, ${regularUser.full_name}`);

  const topicSE = await prisma.topic.upsert({
    where: { name: 'Software Engineering' },
    update: {},
    create: {
      name: 'Software Engineering',
      description: 'Learn the fundamentals of software engineering, from design patterns to deployment.',
    },
  });

  const topicDS = await prisma.topic.upsert({
    where: { name: 'Data Science' },
    update: {},
    create: {
      name: 'Data Science',
      description: 'Explore the world of data, from basic statistics to advanced machine learning.',
    },
  });

  console.log(`Created topics: ${topicSE.name}, ${topicDS.name}`);

  await prisma.quizQuestion.deleteMany({
    where: { topic_id: topicSE.id },
  });
  console.log(`Cleaned old quiz questions for ${topicSE.name}`);

  await prisma.quizQuestion.createMany({
    data: [
      {
        topic_id: topicSE.id,
        level: CourseDifficulty.beginner,
        question_text: "Apa perbedaan utama antara HTML, CSS, dan JavaScript?",
        options: [
          "HTML (struktur), CSS (style), JS (fungsionalitas)",
          "HTML (logika), CSS (struktur), JS (style)",
          "HTML (struktur), CSS (fungsionalitas), JS (style)",
        ],
        correct_answer_index: 0,
      },
      {
        topic_id: topicSE.id,
        level: CourseDifficulty.beginner,
        question_text: "Apa kepanjangan dari 'CSS'?",
        options: [
          "Cascading Style Sheets",
          "Computer Style Syntax",
          "Creative Style Sheets",
        ],
        correct_answer_index: 0,
      },
      {
        topic_id: topicSE.id,
        level: CourseDifficulty.intermediate,
        question_text: "Apa itu 'async/await' dalam JavaScript?",
        options: [
          "Cara menangani operasi asynchronous",
          "Cara membuat variabel",
          "Sebuah tipe data baru",
        ],
        correct_answer_index: 0,
      },
      {
        topic_id: topicSE.id,
        level: CourseDifficulty.intermediate,
        question_text: "Manakah yang merupakan 'HTTP method' untuk mengambil data?",
        options: ["GET", "POST", "PUSH"],
        correct_answer_index: 0,
      },
      {
        topic_id: topicSE.id,
        level: CourseDifficulty.advanced,
        question_text: "Apa tujuan utama dari 'state management library' seperti Redux?",
        options: [
          "Mengelola state global secara terprediksi",
          "Membuat website lebih cepat",
          "Menggantikan database",
        ],
        correct_answer_index: 0,
      },
    ],
  });
  console.log(`Created 5 quiz questions for ${topicSE.name}`);

  const courseSEBeginner = await prisma.course.upsert({
    where: {
      topic_id_difficulty: {
        topic_id: topicSE.id,
        difficulty: CourseDifficulty.beginner,
      },
    },
    update: {},
    create: {
      title: "Dasar Pengembangan Web untuk Pemula",
      description: "Kursus lengkap untuk belajar HTML, CSS, dan JavaScript dari nol.",
      difficulty: CourseDifficulty.beginner,
      topic_id: topicSE.id,
      generated_by: adminUser.id,
      chapters: {
        create: [
          {
            order_index: 1,
            title: "Pendahuluan: Apa itu Web?",
            description: "Memahami tiga pilar web: HTML, CSS, dan JavaScript.",
            content: "Ini adalah konten lengkap untuk chapter 1...",
            is_active: true,
          },
          {
            order_index: 2,
            title: "HTML: Struktur Halaman",
            description: "Belajar tentang tag, elemen, dan atribut.",
            content: "Ini adalah konten lengkap untuk chapter 2...",
          },
          {
            order_index: 3,
            title: "CSS: Menghias Halaman",
            description: "Membuat halaman Anda terlihat cantik.",
            content: "Ini adalah konten lengkap untuk chapter 3...",
          },
          {
            order_index: 4,
            title: "Studi Kasus: Membuat Halaman Portofolio",
            description: "Menerapkan semua yang telah dipelajari.",
            content: "Instruksi studi kasus...",
            is_study_case: true,
          },
        ],
      },
    },

    include: {
      chapters: {
        orderBy: {
          order_index: 'asc',
        },
      },
    },
  });
  console.log(`Created course: ${courseSEBeginner.title}`);

  await prisma.selectedCourse.upsert({
    where: {
      user_id_course_id: {
        user_id: regularUser.id,
        course_id: courseSEBeginner.id,
      },
    },
    update: {},
    create: {
      user_id: regularUser.id,
      course_id: courseSEBeginner.id,
    },
  });
  console.log(`Enrolled ${regularUser.full_name} in ${courseSEBeginner.title}`);

  
  const firstChapterId = courseSEBeginner.chapters[0].id;
  await prisma.chapterProgress.upsert({
    where: {
      user_id_chapter_id: {
        user_id: regularUser.id,
        chapter_id: firstChapterId,
      },
    },
    update: { is_done: true },
    create: {
      user_id: regularUser.id,
      chapter_id: firstChapterId,
      is_done: true,
    },
  });
  console.log(`Marked chapter 1 as 'done' for ${regularUser.full_name}`);

  console.log(`Seeding finished.`);
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });