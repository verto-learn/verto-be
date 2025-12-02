-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StudyCaseProof" ADD COLUMN     "ai_feedback" TEXT,
ADD COLUMN     "ai_score" INTEGER DEFAULT 0,
ADD COLUMN     "submission_note" TEXT;
