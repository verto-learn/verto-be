import Bull, { Job } from "bull";
import config from "../config/config";
import prisma from "../database/database";
import { textGeminiModel } from "./geminiAI";
import { v4 as uuidv4 } from 'uuid'; // Import UUID

export const gradingQueue = new Bull("grading", {
  redis: {
    port: config.redisPort,
    host: config.redisHost,
    password: config.redisPassword,
  },
});

// --- Helper Functions (Tetap sama seperti kode Anda) ---

function cleanGithubUrl(url: string): string {
  return url.replace(/\.git$/, "").replace(/\/$/, "");
}

async function fetchGithubCode(url: string): Promise<string> {
  if (!url || !url.includes("github.com")) return "";

  const cleanUrl = cleanGithubUrl(url);

  // KASUS 1: User rajin (Kirim Link File Spesifik) -> Tetap ambil file itu
  if (cleanUrl.includes("/blob/")) {
    const rawUrl = cleanUrl
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
    try {
      const res = await fetch(rawUrl);
      if (res.ok) {
         const text = await res.text();
         return `// === FILE UTAMA DARI USER ===\n${text}`;
      }
    } catch (e) {
      console.error("Failed to fetch specific file:", e);
    }
    return "";
  }

  // KASUS 2: User kirim Link Repo (Root) -> Kita harus scan beberapa file
  const parts = cleanUrl.split("/");
  const user = parts[3];
  const repo = parts[4];

  if (!user || !repo) return "";

  const branches = ["main", "master"];
  let combinedCode = "";

  // A. Cari File Config (Penting untuk cek library)
  const configFiles = ["package.json", "requirements.txt", "composer.json", "pubspec.yaml"];
  
  // B. Cari File Kode Utama (Logic)
  const codeFiles = [
    "src/App.jsx", "src/App.js", "src/index.js", "src/main.ts", // Frontend
    "index.js", "app.js", "server.js", "main.go", // Backend JS/Go
    "main.py", "app.py", "manage.py", // Python
    "lib/main.dart", // Flutter
    "index.php" // PHP
  ];

  // Helper untuk fetch
  const tryFetch = async (filename: string, branch: string) => {
    const attemptUrl = `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${filename}`;
    try {
      const res = await fetch(attemptUrl);
      if (res.ok) return await res.text();
    } catch (e) {}
    return null;
  };

  // Logika Scanning
  for (const branch of branches) {
    let branchFound = false;

    // 1. Ambil Config (Cukup 1 saja)
    for (const file of configFiles) {
      const content = await tryFetch(file, branch);
      if (content) {
        combinedCode += `\n\n// === FILE CONFIG: ${file} ===\n${content}`;
        branchFound = true;
        break; // Sudah temu config, lanjut cari code
      }
    }

    // 2. Ambil Source Code (Cukup 1 file utama yang paling relevan)
    for (const file of codeFiles) {
      const content = await tryFetch(file, branch);
      if (content) {
        combinedCode += `\n\n// === FILE CODE UTAMA: ${file} ===\n${content}`;
        branchFound = true;
        break; // Sudah temu main code, stop searching
      }
    }

    // Jika di branch ini kita menemukan sesuatu, kita anggap ini branch yang benar
    // dan kita stop loop branch agar tidak duplikat data dari main & master
    if (branchFound) break;
  }

  // Jika kosong (mungkin repo kosong atau struktur aneh), coba ambil README sebagai fallback terakhir
  if (!combinedCode) {
     for (const branch of branches) {
        const readme = await tryFetch("README.md", branch);
        if (readme) return `// HANYA DITEMUKAN README (Tidak ada kode):\n${readme}`;
     }
  }

  return combinedCode || "Tidak ditemukan file kode umum (index.js, App.jsx, main.py, package.json).";
}

// --- Main Processor ---

export const processGradingQueue = async (job: Job) => {
  const { chapterId, userId } = job.data;

  // 1. Ambil Data Proof
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

  // 2. Fetch Kode dari GitHub
  const fetchedCode = await fetchGithubCode(proof.proof_url);
  const codeSnippet = fetchedCode.slice(0, 15000); 

  // 3. Prompt Engineering
  const prompt = `
    Anda adalah Senior Software Engineer dan Dosen Computer Science yang sangat teliti.
    Tugas Anda adalah menilai submission tugas coding mahasiswa secara otomatis.

    === KONTEKS TUGAS (INSTRUKSI) ===
    """
    ${proof.chapter.content}
    """

    === SUBMISSION MAHASISWA ===
    - URL Repository: ${proof.proof_url}
    - Catatan Mahasiswa: "${proof.submission_note}"
    - Cuplikan Kode (Main File):
    """
    ${codeSnippet}
    """

    === LANGKAH PENILAIAN (WAJIB IKUTI URUTAN INI) ===
    1. **CEK RELEVANSI (CRITICAL):**
       - Bandingkan topik pada "KONTEKS TUGAS" dengan isi "SUBMISSION MAHASISWA".
       - Jika tugas meminta "Data Science/Python" tapi kode berisi "HTML/CSS Website Landing Page" (tidak nyambung), **BERIKAN SKOR 0-10**.
       - Jika kode kosong atau hanya "Hello World", **BERIKAN SKOR 0**.

    2. **CEK IMPLEMENTASI:**
       - Apakah library yang diminta (misal: Pandas, Scikit-learn, React, dll) di-import dan digunakan?
       - Apakah logika kode masuk akal untuk menyelesaikan masalah tersebut?

    3. **BERIKAN SKOR (0-100):**
       - 0-20: Tidak relevan, kode kosong, atau salah total.
       - 21-50: Relevan tapi tidak jalan, atau sangat tidak lengkap.
       - 51-69: Kode relevan, tapi ada bug mayor atau fitur utama hilang (Tidak Lulus).
       - 70-85: Kode berjalan baik, memenuhi instruksi dasar (Lulus).
       - 86-100: Sempurna, rapi, ada handling error, atau fitur tambahan.

    4. **BERIKAN FEEDBACK:**
       - Gunakan Bahasa Indonesia yang sopan namun tegas.
       - Jika tidak relevan, katakan: "Kode yang Anda kirim tidak sesuai dengan instruksi tugas ini."
       - Maksimal 2-3 kalimat.

    === FORMAT OUTPUT JSON (STRICT) ===
    Hanya kembalikan JSON valid. Jangan ada markdown (\`\`\`json) atau teks pengantar.
    {
      "score": number,
      "feedback": "string"
    }
  `;

  try {
    const result = await textGeminiModel.generateContent(prompt);
    const textResponse = result.response.text();

    const cleanedJson = textResponse.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedJson);

    const isApproved = data.score >= 70;
    const pointsToAward = proof.chapter.score;

    // 4. Update Database Logic
    if (proof.approved === isApproved) {
      // Hanya update nilai/feedback jika status lulus/tidak lulus SAMA
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
      // === DISINI LOGIC UTAMA BERUBAH MENJADI INTERACTIVE TRANSACTION ===
      // Menggunakan 'tx' (transaction client) untuk memastikan atomic operation
      await prisma.$transaction(async (tx) => {
        
        // A. Update Proof jadi Approved
        await tx.studyCaseProof.update({
          where: { chapter_id_user_id: { chapter_id: chapterId, user_id: userId } },
          data: {
            ai_score: data.score,
            ai_feedback: data.feedback,
            approved: true
          }
        });

        // B. Tambah Poin User
        await tx.user.update({
          where: { id: userId },
          data: { total_score: { increment: pointsToAward } }
        });

        // C. Update Score di SelectedCourse
        await tx.selectedCourse.update({
          where: { user_id_course_id: { user_id: userId, course_id: proof.chapter.course_id } },
          data: { user_score: { increment: pointsToAward } }
        });

        // D. Tandai Chapter Ini Selesai
        await tx.chapterProgress.update({
          where: { user_id_chapter_id: { user_id: userId, chapter_id: chapterId } },
          data: { is_done: true }
        });

        console.log(`✅ Auto-approved task for user ${userId}. Points awarded: ${pointsToAward}`);

        // === FITUR BARU: GENERATE CERTIFICATE LOGIC ===
        // Cek apakah INI adalah tugas terakhir? Apakah semua chapter lain sudah selesai?
        
        // 1. Ambil semua ID Chapter dalam course ini
        const courseData = await tx.course.findUnique({
            where: { id: proof.chapter.course_id },
            select: { 
                chapters: { select: { id: true } } 
            }
        });

        if (courseData) {
            const allChapterIds = courseData.chapters.map(c => c.id);
            const totalChapters = allChapterIds.length;

            // 2. Hitung berapa chapter yang SUDAH selesai (is_done: true) milik user ini
            // Kita query 'tx' jadi data chapter yg barusan diupdate di langkah (D) sudah terhitung 'true'
            const completedCount = await tx.chapterProgress.count({
                where: {
                    user_id: userId,
                    chapter_id: { in: allChapterIds },
                    is_done: true
                }
            });

            // 3. Jika Total == Selesai, berarti Course Complete!
            if (completedCount === totalChapters) {
                const certId = `CERT-${uuidv4().substring(0, 8).toUpperCase()}`; // Generate ID Unik

                // Update Status Course jadi Completed & Isi Certificate ID
                await tx.selectedCourse.update({
                    where: { user_id_course_id: { user_id: userId, course_id: proof.chapter.course_id } },
                    data: {
                        is_completed: true, 
                        certificate_id: certId
                    }
                });

                console.log(`🏆 COURSE COMPLETED! Certificate Generated: ${certId}`);
            }
        }
      });
    }
    else {
      // Jika Tidak Lulus (Rejected)
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