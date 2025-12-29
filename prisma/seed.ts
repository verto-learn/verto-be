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


 }


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });