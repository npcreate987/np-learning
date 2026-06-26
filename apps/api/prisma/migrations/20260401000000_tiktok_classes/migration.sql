-- CreateEnum
CREATE TYPE "CourseFormat" AS ENUM ('STANDARD', 'TIKTOK');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "format" "CourseFormat" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "caption" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "durationSeconds" INTEGER;

-- CreateIndex
CREATE INDEX "Course_format_idx" ON "Course"("format");
