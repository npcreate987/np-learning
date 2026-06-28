-- CreateEnum
CREATE TYPE "InterestStatus" AS ENUM ('PENDING', 'CONTACTED', 'ENROLLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "LearningInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "note" TEXT,
    "status" "InterestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningInterest_userId_idx" ON "LearningInterest"("userId");

-- CreateIndex
CREATE INDEX "LearningInterest_courseId_idx" ON "LearningInterest"("courseId");

-- CreateIndex
CREATE INDEX "LearningInterest_status_idx" ON "LearningInterest"("status");

-- AddForeignKey
ALTER TABLE "LearningInterest" ADD CONSTRAINT "LearningInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningInterest" ADD CONSTRAINT "LearningInterest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
