export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';

export type GradeLevel =
  | 'PREP_1'
  | 'PREP_2'
  | 'PREP_3'
  | 'SEC_1'
  | 'SEC_2'
  | 'SEC_3_SCIENTIFIC'
  | 'SEC_3_LITERARY'
  /** Taxonomy-derived compatibility values (no GENERAL-system equivalent) */
  | 'AZHAR_PREP'
  | 'AZHAR_SEC'
  | 'BAC';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentProfile?: {
    id: string;
    fullName: string;
    guardianPhone: string;
    gradeLevel: GradeLevel;
    photoUrl?: string | null;
  } | null;
  teacherProfile?: {
    id: string;
    fullName: string;
    specialization: string;
    photoUrl?: string | null;
    address?: string | null;
    bio?: string | null;
    extraInfo?: string | null;
    workPlaces: string[];
  } | null;
}

export interface RegisterStudentDto {
  fullName: string;
  email: string;
  phone: string;
  guardianPhone: string;
  password: string;
  /** Normalized taxonomy Grade UUID — the source of truth (backend derives legacy gradeLevel) */
  gradeId: string;
  /** Required when the selected grade has mandatory tracks */
  trackId?: string | null;
}

export interface VerifyOtpDto {
  phone: string;
  otp: string;
}

export interface ResendOtpDto {
  phone: string;
}

export interface LoginDto {
  email?: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number | string;
  user: User;
}
