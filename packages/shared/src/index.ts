export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";
export type CourseStatus = "DRAFT" | "PUBLISHED";
export type LessonType = "TEXT" | "VIDEO";

export interface Profile {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  notifyEmail: boolean;
  referralCode: string | null;
  referredById: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "welcome"
  | "referral"
  | "info"
  | "certificate";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface ReferralMe {
  referralCode: string;
  referredBy: { referralCode: string; displayName: string | null } | null;
  stats: { referrals: number; enrolled: number };
  recentReferrals: {
    id: string;
    displayName: string | null;
    email: string;
    createdAt: string;
  }[];
}

/* ----------------------------- Admin ----------------------------- */

export interface AdminStats {
  users: { total: number; students: number; instructors: number; admins: number };
  courses: { total: number; published: number; draft: number };
  enrollments: number;
  certificates: number;
  leads: {
    total: number;
    pending: number;
    contacted: number;
    enrolled: number;
    cancelled: number;
  };
  recentLeads: {
    id: string;
    fullName: string;
    phone: string;
    status: string;
    createdAt: string;
    course: { title: string } | null;
  }[];
  recentEnrollments: {
    id: string;
    createdAt: string;
    user: { email: string; displayName: string | null };
    course: { title: string };
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: string;
  _count: { enrollments: number; referrals: number };
}

export interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  status: CourseStatus;
  priceCents: number;
  createdAt: string;
  instructor: { id: string; displayName: string | null; email: string };
  _count: { sections: number; enrollments: number };
}

export interface AdminPost {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; displayName: string | null; email: string };
  _count: { comments: number; likes: number };
}

export type BroadcastAudience = "ALL" | "STUDENT" | "INSTRUCTOR";

export interface BroadcastResult {
  sent: number;
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
