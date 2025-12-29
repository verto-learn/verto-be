/*
  Warnings:

  - A unique constraint covering the columns `[certificate_id]` on the table `SelectedCourse` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "SelectedCourse" ADD COLUMN     "certificate_id" TEXT,
ADD COLUMN     "is_completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "SelectedCourse_certificate_id_key" ON "SelectedCourse"("certificate_id");
