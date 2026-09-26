export const ENDPOINTS = {
  // Auth
  AUTH: {
    REGISTER_STUDENT: '/auth/student/register',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    PARENT_REQUEST_OTP: '/auth/parent/request-otp',
    PARENT_VERIFY_OTP: '/auth/parent/verify-otp',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },

  // Parent portal (ولي الأمر)
  PARENT: {
    ME: '/parent/me',
    STUDENT_PROFILE: (studentId: string) => `/parent/students/${studentId}/profile`,
    STUDENT_RESULTS: (studentId: string) => `/parent/students/${studentId}/results`,
    STUDENT_LESSONS: (studentId: string) => `/parent/students/${studentId}/lessons`,
  },

  // Profile
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile',
    CHANGE_PASSWORD: '/profile/password',
    TEACHER: (id: string) => `/teachers/${id}/profile`,
  },

  // Courses
  COURSES: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    CREATE: '/courses',
    UPDATE: (id: string) => `/courses/${id}`,
    DELETE: (id: string) => `/courses/${id}`,
    UPLOAD_THUMBNAIL: (id: string) => `/courses/${id}/thumbnail`,
    ENROLL_FREE: (id: string) => `/courses/${id}/enroll-free`,
    EXAMS: (courseId: string) => `/courses/${courseId}/exams`,
    CURRICULUM: (id: string) => `/courses/${id}/curriculum`,
    PROGRESS: (id: string) => `/courses/${id}/progress`,
  },

  // Sections
  SECTIONS: {
    CREATE: (courseId: string) => `/courses/${courseId}/sections`,
    UPDATE: (id: string) => `/sections/${id}`,
    DELETE: (id: string) => `/sections/${id}`,
    REORDER: (courseId: string) => `/courses/${courseId}/sections/reorder`,
  },

  // Lessons
  LESSONS: {
    CREATE: (courseId: string) => `/courses/${courseId}/lessons`,
    UPDATE: (id: string) => `/lessons/${id}`,
    DELETE: (id: string) => `/lessons/${id}`,
    REORDER: '/lessons/reorder',
    VIDEO_UPLOAD_URL: (id: string) => `/lessons/${id}/video-upload-url`,
    VIDEO_UPLOAD_FILE: (id: string) => `/lessons/${id}/video`,
    CONFIRM_VIDEO: (id: string) => `/lessons/${id}/confirm-video`,
    STREAM_URL: (id: string) => `/lessons/${id}/stream-url`,
    PROGRESS: (id: string) => `/lessons/${id}/progress`,
    MATERIALS_CREATE: (courseId: string) => `/courses/${courseId}/materials`,
    MATERIALS_DELETE: (id: string) => `/materials/${id}`,
  },

  // Payments & Checkout
  PAYMENTS: {
    CHECKOUT: '/payments/checkout',
    SUBMIT_RECEIPT: (paymentId: string) => `/payments/${paymentId}/submit-receipt`,
    RETRY: (enrollmentId: string) => `/payments/${enrollmentId}/retry`,
    CANCEL: (paymentId: string) => `/payments/${paymentId}/cancel`,
    MY_PAYMENTS: '/payments/my-payments',
    TEACHER_PAYMENTS: '/payments/teacher',
    ACCEPT: (paymentId: string) => `/payments/${paymentId}/accept`,
    REJECT: (paymentId: string) => `/payments/${paymentId}/reject`,
  },

  // Exams & Question Bank
  EXAMS: {
    CREATE: (courseId: string) => `/courses/${courseId}/exams`,
    UPDATE: (id: string) => `/exams/${id}`,
    DELETE: (id: string) => `/exams/${id}`,
    ADD_QUESTION: (examId: string) => `/exams/${examId}/questions`,
    GET_QUESTIONS: (examId: string) => `/exams/${examId}/questions`,
    UPLOAD_QUESTION_IMAGE: (examId: string) => `/exams/${examId}/questions/upload-image`,
    UPDATE_QUESTION: (questionId: string) => `/questions/${questionId}`,
    DELETE_QUESTION: (questionId: string) => `/questions/${questionId}`,
    SUBMISSIONS: (examId: string) => `/exams/${examId}/submissions`,
    START: (examId: string) => `/exams/${examId}/start`,
    MY_ATTEMPTS: (examId: string) => `/exams/${examId}/my-attempts`,
    SUBMIT_ATTEMPT: (attemptId: string) => `/exams/attempts/${attemptId}/submit`,
    ATTEMPT_RESULT: (attemptId: string) => `/exams/attempts/${attemptId}/result`,
    ATTEMPT_DETAIL: (attemptId: string) => `/exams/attempts/${attemptId}/detail`,
    GET_QUESTION: (attemptId: string, index: number) => `/exam-attempts/${attemptId}/question/${index}`,
    ANSWER_QUESTION: (attemptId: string) => `/exam-attempts/${attemptId}/answer`,
    RECORD_EXIT: (attemptId: string) => `/exam-attempts/${attemptId}/exit`,
    RESULT_PDF: (attemptId: string) => `/exam-attempts/${attemptId}/result/pdf`,
    MISTAKE_PRACTICE: '/students/me/mistakes/practice-exam',
    SUBMIT_MISTAKE_PRACTICE: '/students/me/mistakes/practice-exam/submit',
  },

  // Dashboard
  DASHBOARD: {
    STUDENT: '/dashboard/student',
    TEACHER: '/dashboard/teacher',
    ADMIN: '/dashboard/admin',
    TASKS: '/dashboard/tasks',
  },

  // Mini Quizzes
  QUIZZES: {
    CREATE: (lessonId: string) => `/lessons/${lessonId}/quiz`,
    UPDATE: (id: string) => `/quizzes/${id}`,
    ADD_QUESTION: (quizId: string) => `/quizzes/${quizId}/questions`,
    DELETE: (id: string) => `/quizzes/${id}`,
    LESSON_QUIZ: (lessonId: string) => `/lessons/${lessonId}/quiz`,
    TEACHER_LESSON_QUIZZES: (lessonId: string) => `/lessons/${lessonId}/quizzes`,
    START: (quizId: string) => `/quizzes/${quizId}/start`,
    SUBMIT: (attemptId: string) => `/quiz-attempts/${attemptId}/submit`,
    RESULT: (attemptId: string) => `/quiz-attempts/${attemptId}/result`,
  },

  // Live Lectures
  LIVE_LECTURES: {
    CREATE: '/live-lectures',
    DETAIL: (id: string) => `/live-lectures/${id}`,
    UPDATE: (id: string) => `/live-lectures/${id}`,
    DELETE: (id: string) => `/live-lectures/${id}`,
    START: (id: string) => `/live-lectures/${id}/start`,
    END: (id: string) => `/live-lectures/${id}/end`,
    CANCEL: (id: string) => `/live-lectures/${id}/cancel`,
    JOIN: (id: string) => `/live-lectures/${id}/join`,
    STUDENT_UPCOMING: '/live-lectures/student/upcoming',
    TEACHER_UPCOMING: '/live-lectures/teacher/upcoming',
    TEACHER_HISTORY: '/live-lectures/teacher/history',
    ATTENDANCE: (id: string) => `/live-lectures/${id}/attendance`,
    ATTENDANCE_JOIN: (id: string) => `/live-lectures/${id}/attendance/join`,
    ATTENDANCE_LEAVE: (id: string) => `/live-lectures/${id}/attendance/leave`,
    MUTE_PARTICIPANT: (id: string, pid: string) => `/live-lectures/${id}/participants/${pid}/mute`,
    REMOVE_PARTICIPANT: (id: string, pid: string) => `/live-lectures/${id}/participants/${pid}/remove`,
    ALLOW_SPEAKING: (id: string, pid: string) => `/live-lectures/${id}/participants/${pid}/allow-speaking`,
    PUBLISH_PERMISSION: (id: string, pid: string) => `/live-lectures/${id}/participants/${pid}/publish-permission`,
    MUTE_ALL: (id: string) => `/live-lectures/${id}/mute-all`,
  },

  // Challenges (Competition)
  CHALLENGES: {
    LIST: '/challenges',
    CREATE: '/challenges',
    AVAILABILITY: '/challenges/availability',
    DETAIL: (id: string) => `/challenges/${id}`,
    ACCEPT: (id: string) => `/challenges/${id}/accept`,
    REJECT: (id: string) => `/challenges/${id}/reject`,
    START: (id: string) => `/challenges/${id}/start`,
    ANSWER: (id: string) => `/challenges/${id}/answers`,
    FINISH: (id: string) => `/challenges/${id}/finish`,
    RESULT: (id: string) => `/challenges/${id}/result`,
    ONLINE_STUDENTS: (courseId: string) => `/courses/${courseId}/online-students`,
    HEARTBEAT: '/students/me/heartbeat',
  },

  // Adhkar & Duas (أذكار وأدعية)
  ADHKAR: {
    LIST: '/adhkar',
    DISMISSALS: '/adhkar/dismissals',
    DISMISS: '/adhkar/dismiss',
    RANDOM_DUA: '/duas/random',
  },
};
