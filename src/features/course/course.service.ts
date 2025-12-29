import { CourseDifficulty } from "@prisma/client";
import prisma from "../../database/database";
import { outlinePrompt } from "../../shared/getPrompt";
import { textGeminiModel } from "../../shared/geminiAI";
import { generateChapterContent } from "../../shared/chapterQueue";
import { APIError } from "../../middleware/errorHandler";


type GeneratedChapterStructured = {
  title: string;
  description: string;
  is_study_case: boolean;
  score: number; 
};

type GeneratedCourseStructured = {
  title: string;
  difficulty: CourseDifficulty;
  description: string;
  total_possible_score: number; 
  chapters: GeneratedChapterStructured[];
};

export const createCourseService = async (
  topicId: string,
  difficulty: CourseDifficulty,
  userId: string,
) => {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
  });

  if (!topic) {
    throw new APIError("Topic not found", 404);
  }

  const prompt = outlinePrompt(topic.name, difficulty);

  const responseModel = await textGeminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const generatedCourse: GeneratedCourseStructured = JSON.parse(
    responseModel.response.text(),
  );


  const generatedChapters = generatedCourse.chapters.map((chapter, idx) => ({
    order_index: idx + 1,
    title: chapter.title,
    description: chapter.description,
    is_active: false,
    is_study_case: chapter.is_study_case ?? false,
    score: chapter.score ?? 0, 
  }));


  const course = await prisma.course.create({
    data: {
      topic_id: topicId,
      title: generatedCourse.title,
      description: generatedCourse.description,
      difficulty: difficulty,
      generated_by: userId,
      total_possible_score: generatedCourse.total_possible_score ?? 0, 
      chapters: {
        createMany: {
          data: generatedChapters,
        },
      },
    },
    include: {
      topic: true,
      chapters: {
        select: {
          id: true,
          title: true,
          description: true,
          order_index: true,
          is_active: true,
          is_study_case: true,
          score: true, 
        },
        orderBy: { order_index: "asc" },
      },
    },
  });

  
  // await prisma.selectedCourse.create({ 
  //   data: {
  //     user_id: userId,
  //     course_id: course.id,
  //     user_score: 0,
  //   },
  // });

 
  for (const chapter of course.chapters) {
    await prisma.chapterProgress.create({ 
      data: {
        user_id: userId,
        chapter_id: chapter.id,
        is_done: false,
      },
    });


    await generateChapterContent({
      chapterId: chapter.id,
    });
  }

  return course;
};


export const getSelectedCoursesService = async (user_id: string) => {
  const selectedCourses = await prisma.selectedCourse.findMany({ 
    where: {
      user_id,
    },
    include: {
      course: {
        include: {
          chapters: {
            include: {
              progress: {
                where: { user_id },
                select: { is_done: true, is_active: true },
              },
              study_case_proofs: {
                where: { user_id },
                select: { proof_url: true, approved: true, ai_score: true, ai_feedback: true },
              },
            },
            orderBy: { order_index: "asc" }
          },
        },
      },
    },
  });

  if (!selectedCourses || selectedCourses.length === 0) {
    return []; 
  }


  const formattedCourses = selectedCourses.map(sc => ({
    user_score: sc.user_score, 
    course: {
      ...sc.course,
      total_possible_score: sc.course.total_possible_score 
    }
  }));

  return formattedCourses;
};

export const getCourseDetailService = async (
  user_id: string,
  course_id: string,
) => {
  const selectedCourse = await prisma.selectedCourse.findUnique({
    where: {
      user_id_course_id: {
        user_id,
        course_id,
      },
    },
    include: {
      course: {
        include: {
          topic: { 
            select: { name: true },
          },
          chapters: { // Ambil semua chapter
            orderBy: { order_index: "asc" },
            
            include: {
              progress: {
                where: { user_id },
                select: { is_done: true, is_active: true, },
              },
              study_case_proofs: {
                where: { user_id },
                select: { 
                  proof_url: true, 
                  approved: true,
                  submission_note: true, 
                  ai_score: true,        
                  ai_feedback: true     
                 },
              },
            },
          },
        },
      },
    },
  });

  if (!selectedCourse) {
    throw new APIError("Course not found or user not enrolled", 404);
  }


  const { course, user_score } = selectedCourse;

  const formattedChapters = course.chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    content: chapter.content, 
    video_url: chapter.video_url,
    order_index: chapter.order_index,
    is_study_case: chapter.is_study_case,
    score: chapter.score,
    is_done: chapter.progress[0]?.is_done ?? false,
    is_active: chapter.is_active ?? false,               // global chapter activation
    user_is_active: chapter.progress[0]?.is_active ?? false, // per-user active flag
    study_case_proof: chapter.study_case_proofs[0] ?? null,
  }));

  const response = {
    id: course.id,
    title: course.title,
    description: course.description,
    difficulty: course.difficulty,
    topic: course.topic.name,
    user_score: user_score, 
    total_possible_score: course.total_possible_score,
    chapters: formattedChapters,
  };

  return response;
};

export const updateCoursePublishStatusService = async (
  courseId: string,
  isPublished: boolean
) => {
  // Cek apakah course ada
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    throw new APIError("Course not found", 404);
  }

  // Update status
  const updatedCourse = await prisma.course.update({
    where: { id: courseId },
    data: {
      is_published: isPublished,
    },
    select: {
      id: true,
      title: true,
      is_published: true,
    }
  });

  return updatedCourse;
};


export const updateStatusStudyCaseService = async (
  user_id: string,
  chapter_id: string,
  approved: boolean,
) => {
  const currentProof = await prisma.studyCaseProof.findUnique({
    where: {
      chapter_id_user_id: {
        chapter_id,
        user_id,
      },
    },
    include: {
      chapter: {
        select: {
          score: true,      
          course_id: true,  
        },
      },
    },
  });

  if (!currentProof) {
    throw new APIError("Study case proof not found", 404);
  }

  if (currentProof.approved === approved) {
    return currentProof;
  }

  const scoreAmount = currentProof.chapter.score;
  const courseId = currentProof.chapter.course_id;

  const scoreOperation = approved
    ? { increment: scoreAmount }
    : { decrement: scoreAmount };

  try {
    const [updatedProof] = await prisma.$transaction([
      prisma.studyCaseProof.update({
        where: {
          chapter_id_user_id: { chapter_id, user_id },
        },
        data: { approved },
      }),

      prisma.user.update({
        where: { id: user_id },
        data: {
          total_score: scoreOperation,
        },
      }),

      prisma.selectedCourse.update({
        where: {
          user_id_course_id: { user_id, course_id: courseId },
        },
        data: {
          user_score: scoreOperation,
        },
      }),

      prisma.chapterProgress.update({
        where: {
            user_id_chapter_id: { user_id, chapter_id }
        },
        data: { is_done: approved }
      })
    ]);

    return updatedProof;

  } catch (error) {
    console.error("Failed to update score transaction:", error);
    throw new APIError("Failed to update status and score", 500);
  }
};

export const collectStudyCaseProofService = async (
  user_id: string,
  chapter_id: string,
  proof_url: string,
  notes: string
) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapter_id, is_study_case: true },
  });

  if (!chapter) {
    throw new APIError("Chapter not found or not a study case", 404);
  }

  const submitProofLink = await prisma.studyCaseProof.upsert({
    where: {
      chapter_id_user_id: {
        chapter_id,
        user_id,
      },
    },
    create: {
      chapter_id,
      user_id,
      proof_url,
      submission_note: notes
    },
    update: {
      proof_url,
      submission_note: notes, 
      approved: false, 
      ai_score: 0,    
      ai_feedback: null
    },
  });

  return submitProofLink;
};

export const getAllStudyCaseProofsService = async () => {
  return await prisma.studyCaseProof.findMany({
    include: {
      chapter: {
        select: {
          title: true,
          score: true, 
          course: {
            select: {
              title: true,
              difficulty: true,
            },
          },
        },
      },
      user: {
        select: {
          full_name: true,
          email: true,
        },
      },
    },
  });
};

export const selectCompleteChapterService = async (
  user_id: string,
  chapter_id: string,
) => {
  const progressExists = await prisma.chapterProgress.findUnique({
    where: {
      user_id_chapter_id: {
        user_id,
        chapter_id,
      },
    },
  });

  if (!progressExists) {
    throw new APIError("Chapter progress not found", 404);
  }

  const completedChapter = await prisma.chapterProgress.update({
    where: {
      user_id_chapter_id: { user_id, chapter_id },
    },
    data: { is_done: true },
  });

  return completedChapter;
};

export const getAllCourseService = async () => {
  return await prisma.course.findMany({
    include: {
      topic: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          chapters: true,
          SelectedCourse: true,
        }
      }
    },
    orderBy: {
      created_at: "desc"
    }
  });
};

export const deleteSelectedCourseService = async (course_id: string) => {
  return await prisma.course.delete({
    where: {
      id: course_id,
    },
  });
};

export const chatWithChapterService = async (chapterId: string, question: string) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { title: true, content: true, course: { select: { title: true } } }
  });

  if (!chapter || !chapter.content) {
    throw new APIError("Materi tidak ditemukan.", 404);
  }
  const contextContent = chapter.content.slice(0, 8000); 

  const prompt = `
    Kamu adalah asisten tutor untuk course "${chapter.course.title}".
      User sedang mempelajari bab: "${chapter.title}".

      === MATERI BAB INI ===
      """
      ${contextContent}
      """

      === PERTANYAAN USER ===
      "${question}"

      === INSTRUKSI WAJIB ===
      1. Jawab pertanyaan **hanya** menggunakan informasi dari materi bab di atas.
      2. Jika tidak ditemukan jawaban dalam materi, balas:  
        "Maaf, informasi tersebut tidak ada dalam bab ini."
      3. Buat jawaban yang:
        - akurat dan langsung ke inti
        - ramah, ringkas, dan memotivasi
        - menggunakan Bahasa Indonesia yang natural
      4. Jangan menambahkan informasi dari luar materi.

  `;

  const result = await textGeminiModel.generateContent(prompt);
  return result.response.text();
};