-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('PLACEMENT', 'PRACTICE');

-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "quiz_type" "QuizType" NOT NULL DEFAULT 'PRACTICE',
ALTER COLUMN "calculated_difficulty" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_answer_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "topic_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "points_earned" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentQuestion_topic_id_idx" ON "AssessmentQuestion"("topic_id");

-- CreateIndex
CREATE INDEX "Assessment_user_id_topic_id_idx" ON "Assessment"("user_id", "topic_id");

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
