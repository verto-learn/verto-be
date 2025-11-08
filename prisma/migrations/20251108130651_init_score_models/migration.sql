-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "total_possible_score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SelectedCourse" ADD COLUMN     "user_score" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "total_score" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "User_total_score_idx" ON "User"("total_score");
