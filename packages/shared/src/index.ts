export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type CourseStatus = "DRAFT" | "PUBLISHED";
export type LessonType = "TEXT" | "VIDEO";

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
}

export interface Lesson {
  id: string;
  sectionId: string;
  title: string;
  /** Tiptap JSON document */
  contentJson: unknown;
  type: LessonType;
  order: number;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  url: string;
  name: string;
  size?: number;
  contentType?: string;
}

export interface Section {
  id: string;
  courseId: string;
  title: string;
  order: number;
  lessons?: Lesson[];
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  status: CourseStatus;
  priceCents: number;
  instructorId: string;
  instructor?: Pick<Profile, "id" | "displayName">;
  sections?: Section[];
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  createdAt: string;
}

export interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  completedLessonIds: string[];
}

export interface PresignResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
