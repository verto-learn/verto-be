import Bull, { Job } from "bull";
import config from "../config/config";
import prisma from "../database/database";
import { textGeminiModel } from "./geminiAI";

export const gradingQueue = new Bull("grading", {
  redis: {
    port: config.redisPort,
    host: config.redisHost,
    password: config.redisPassword,
  },
});

async function fetchGithubCode(url: string): Promise<string> {
  if (!url.includes("github.com")) return "";
  try {
 
    const rawUrl = url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
    
    const res = await fetch(rawUrl);
    if (res.ok) return await res.text();
  } catch (e) {
    console.error("Failed to fetch GitHub raw content", e);
  }
  return "";
}

export const processGradingQueue = async (job: Job) => {
  const { chapterId, userId } = job.data;


  const proof = await prisma.studyCaseProof.findUnique({
    where: {
      chapter_id_user_id: { chapter_id: chapterId, user_id: userId },
    },
    include: { 
      chapter: {
        select: {
          content: true,
          score: true,      
          course_id: true   
        }
      } 
    },
  });

  if (!proof) {
    console.log(`Proof not found for user ${userId} chapter ${chapterId}`);
    return;
  }


  const fetchedCode = await fetchGithubCode(proof.proof_url);
  const codeSnippet = fetchedCode.slice(0, 3000);


  const prompt = `
    Bertindaklah sebagai Senior Engineer yang menilai tugas mahasiswa.
    
    SOAL/INSTRUKSI:
    ${proof.chapter.content}

    JAWABAN MAHASISWA:
    - URL: ${proof.proof_url}
    - Penjelasan: "${proof.submission_note}"
    ${codeSnippet ? `- Cuplikan Kode: \n\`\`\`\n${codeSnippet}\n\`\`\`` : ""}

    TUGAS:
    Nilai relevansi tugas ini (0-100).
    - Jika ada kode, cek apakah sesuai instruksi.
    - Jika tidak ada kode, nilai logika penjelasannya.
    - Berikan feedback singkat (maks 2 kalimat) dalam Bahasa Indonesia.

    Output JSON Only:
    { "score": number, "feedback": string }
  `;

  try {
    const result = await textGeminiModel.generateContent(prompt);
    const textResponse = result.response.text();
    

    const cleanedJson = textResponse.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedJson);


    const isApproved = data.score >= 70; 
    const pointsToAward = proof.chapter.score;


    if (proof.approved === isApproved) {
        await prisma.studyCaseProof.update({
            where: { chapter_id_user_id: { chapter_id: chapterId, user_id: userId } },
            data: {
                ai_score: data.score,
                ai_feedback: data.feedback,
            }
        });
        console.log(`User ${userId} re-submitted. Score updated, status unchanged.`);
        return;
    }

    if (isApproved) {
        await prisma.$transaction([
         
            prisma.studyCaseProof.update({
                where: { chapter_id_user_id: { chapter_id: chapterId, user_id: userId } },
                data: {
                    ai_score: data.score,
                    ai_feedback: data.feedback,
                    approved: true
                }
            }),
          
            prisma.user.update({
                where: { id: userId },
                data: { total_score: { increment: pointsToAward } }
            }),
           
            prisma.selectedCourse.update({
                where: { user_id_course_id: { user_id: userId, course_id: proof.chapter.course_id } },
                data: { user_score: { increment: pointsToAward } }
            }),
          
            prisma.chapterProgress.update({
                where: { user_id_chapter_id: { user_id: userId, chapter_id: chapterId } },
                data: { is_done: true }
            })
        ]);
        console.log(`Auto-approved task for user ${userId}. Points awarded: ${pointsToAward}`);
    } 
    else {
        await prisma.studyCaseProof.update({
            where: { chapter_id_user_id: { chapter_id: chapterId, user_id: userId } },
            data: {
                ai_score: data.score,
                ai_feedback: data.feedback,
                approved: false
            }
        });
        console.log(`Task rejected for user ${userId}. Score: ${data.score}`);
    }

  } catch (error) {
    console.error("AI Grading failed:", error);
  }
};