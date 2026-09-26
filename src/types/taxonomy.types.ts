export interface EducationSystem {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  stages?: EducationalStage[];
}

export interface EducationalStage {
  id: string;
  code: string;
  name: string;
  educationSystemId: string;
  isActive: boolean;
}

export interface Track {
  id: string;
  code: string;
  name: string;
  gradeId: string;
  isActive: boolean;
}

export interface Grade {
  id: string;
  code: string;
  name: string;
  stageId: string;
  hasTracks: boolean;
  isActive: boolean;
  tracks?: Track[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

/** Display-ready target objects returned by the API (never raw IDs) */
export interface CourseTargetRef {
  id: string;
  courseId?: string;
  grade: {
    id: string;
    code: string;
    name: string;
    stageId?: string;
    stage?: {
      id: string;
      code?: string;
      name?: string;
      educationSystemId?: string;
      educationSystem?: { id: string; name: string } | null;
    } | null;
  };
  track: { id: string; code: string; name: string } | null;
}

/** Payload shape used when a teacher picks targets */
export interface TargetInput {
  gradeId: string;
  trackId?: string | null;
}

export interface StudentEducationProfile {
  id: string;
  educationSystemId: string;
  stageId: string;
  gradeId: string;
  trackId: string | null;
  system: EducationSystem;
  stage: EducationalStage;
  grade: Grade;
  track: Track | null;
}
