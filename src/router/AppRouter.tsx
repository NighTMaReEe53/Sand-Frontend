import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { LearningReminderBar } from '../components/layout/LearningReminderBar';
import { Footer } from '../components/layout/Footer';
import { CartDrawer } from '../components/layout/CartDrawer';
import { PageTransition } from '../components/animations/PageTransition';
import { ScrollProgressBar } from '../components/layout/ScrollProgressBar';
import { ScrollToTop } from '../components/layout/ScrollToTop';
import { ConnectivityStatus } from '../components/layout/ConnectivityStatus';
import { DuaToastProvider } from '../components/adhkar/DuaToastProvider';
import { ProtectedRoute } from './ProtectedRoute';
import { GuestRoute } from './ProtectedRoute';
import { PageLoader } from '../components/ui/PageLoader';
import { useAuthStore } from '../store/authStore';

const AnalyticsRedirect: React.FC = () => {
  const { isAuthenticated, role } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (role === 'TEACHER' || role === 'ADMIN') return <Navigate to="/dashboard/analytics" replace />;
  return <Navigate to="/my-performance" replace />;
};

/* ═══════════════════════════════════════════════════════════════════
   Route-level code splitting — pages are lazy loaded on demand,
   with core landing pages eagerly available for 0ms transitions.
   ═══════════════════════════════════════════════════════════════════ */

// Public & Student Pages
const HomePage = lazy(() => import('../pages/Home/HomePage').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('../pages/About/AboutPage').then((m) => ({ default: m.AboutPage })));
const CoursesPage = lazy(() => import('../pages/Courses/CoursesPage').then((m) => ({ default: m.CoursesPage })));
const CourseDetailsPage = lazy(() => import('../pages/CourseDetails/CourseDetailsPage').then((m) => ({ default: m.CourseDetailsPage })));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/Auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerifyOtpPage = lazy(() => import('../pages/Auth/VerifyOtpPage').then((m) => ({ default: m.VerifyOtpPage })));
const CheckoutPage = lazy(() => import('../pages/Checkout/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const MyCoursesPage = lazy(() => import('../pages/MyCourses/MyCoursesPage').then((m) => ({ default: m.MyCoursesPage })));
const MyMaterialsPage = lazy(() => import('../pages/Materials/MyMaterialsPage').then((m) => ({ default: m.MyMaterialsPage })));
const MyPaymentsPage = lazy(() => import('../pages/MyCourses/MyPaymentsPage').then((m) => ({ default: m.MyPaymentsPage })));
const LessonPlayerPage = lazy(() => import('../pages/Learn/LessonPlayerPage').then((m) => ({ default: m.LessonPlayerPage })));
const HomeworkSolvePage = lazy(() => import('../pages/Learn/HomeworkSolvePage').then((m) => ({ default: m.HomeworkSolvePage })));
const HomeworkResultPage = lazy(() => import('../pages/Learn/HomeworkResultPage').then((m) => ({ default: m.HomeworkResultPage })));
const QuizSolvePage = lazy(() => import('../pages/Learn/QuizSolvePage').then((m) => ({ default: m.QuizSolvePage })));
const QuizResultPage = lazy(() => import('../pages/Learn/QuizResultPage').then((m) => ({ default: m.QuizResultPage })));
const StudentHomeworkResultsPage = lazy(() => import('../pages/Homework/StudentHomeworkResultsPage').then((m) => ({ default: m.StudentHomeworkResultsPage })));
const MyPerformancePage = lazy(() => import('../pages/Performance/MyPerformancePage').then((m) => ({ default: m.MyPerformancePage })));
const NotificationsPage = lazy(() => import('../pages/Notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const StudyPlannerPage = lazy(() => import('../pages/StudyPlanner/StudyPlannerPage').then((m) => ({ default: m.StudyPlannerPage })));
const MyBacklogPage = lazy(() => import('../pages/Backlog/MyBacklogPage').then((m) => ({ default: m.MyBacklogPage })));
const TeacherAnalyticsPage = lazy(() => import('../pages/Dashboard/TeacherAnalyticsPage').then((m) => ({ default: m.TeacherAnalyticsPage })));
const CourseAnalyticsPage = lazy(() => import('../pages/Dashboard/CourseAnalyticsPage').then((m) => ({ default: m.CourseAnalyticsPage })));
const QuestionBankPage = lazy(() => import('../pages/Dashboard/QuestionBankPage').then((m) => ({ default: m.QuestionBankPage })));
const VerifyCertificatePage = lazy(() => import('../pages/Certificates/Certificates').then((m) => ({ default: m.VerifyCertificatePage })));
const AuditLogsPage = lazy(() => import('../pages/Dashboard/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const DashboardTaxonomyPage = lazy(() => import('../pages/Dashboard/DashboardTaxonomyPage').then((m) => ({ default: m.DashboardTaxonomyPage })));
const CourseExamsPage = lazy(() => import('../pages/Exams/CourseExamsPage').then((m) => ({ default: m.CourseExamsPage })));
const ExamAttemptPage = lazy(() => import('../pages/Exams/ExamAttemptPage').then((m) => ({ default: m.ExamAttemptPage })));
const ExamResultPage = lazy(() => import('../pages/Exams/ExamResultPage').then((m) => ({ default: m.ExamResultPage })));
const MyAttemptsPage = lazy(() => import('../pages/Exams/MyAttemptsPage').then((m) => ({ default: m.MyAttemptsPage })));
const ExamLeaderboardPage = lazy(() => import('../pages/Exams/ExamLeaderboardPage').then((m) => ({ default: m.ExamLeaderboardPage })));
const ExamRankingsPage = lazy(() => import('../pages/Exams/ExamRankingsPage').then((m) => ({ default: m.ExamRankingsPage })));
const MyResultsPage = lazy(() => import('../pages/Results/MyResultsPage').then((m) => ({ default: m.MyResultsPage })));
const ParentDashboardPage = lazy(() => import('../pages/Parent/ParentDashboardPage').then((m) => ({ default: m.ParentDashboardPage })));
const MyMistakesPage = lazy(() => import('../pages/Mistakes/MyMistakesPage').then((m) => ({ default: m.MyMistakesPage })));
const MistakePracticeExamPage = lazy(() => import('../pages/Mistakes/MistakePracticeExamPage').then((m) => ({ default: m.MistakePracticeExamPage })));
const DashboardStudentMonitorPage = lazy(() => import('../pages/Dashboard/DashboardStudentMonitorPage').then((m) => ({ default: m.DashboardStudentMonitorPage })));
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const StudentLiveLecturesPage = lazy(() => import('../pages/LiveLectures/StudentLiveLecturesPage').then((m) => ({ default: m.StudentLiveLecturesPage })));
const LiveLectureDetailPage = lazy(() => import('../pages/LiveLectures/LiveLectureDetailPage').then((m) => ({ default: m.LiveLectureDetailPage })));
const TeacherLiveLecturesPage = lazy(() => import('../pages/LiveLectures/TeacherLiveLecturesPage').then((m) => ({ default: m.TeacherLiveLecturesPage })));
const ChallengesPage = lazy(() => import('../pages/Challenges/ChallengesPage').then((m) => ({ default: m.ChallengesPage })));
const ChallengePlayPage = lazy(() => import('../pages/Challenges/ChallengePlayPage').then((m) => ({ default: m.ChallengePlayPage })));
const ChallengeResultPage = lazy(() => import('../pages/Challenges/ChallengePlayPage').then((m) => ({ default: m.ChallengeResultPage })));
const AdhkarPage = lazy(() => import('../pages/Adhkar/AdhkarPage').then((m) => ({ default: m.AdhkarPage })));
const AvatarShopPage = lazy(() => import('../pages/Shop/AvatarShopPage').then((m) => ({ default: m.default })));
const FrameShopPage = lazy(() => import('../pages/Shop/FrameShopPage').then((m) => ({ default: m.default })));
const StudentPublicProfilePage = lazy(() => import('../pages/Profile/StudentPublicProfilePage').then((m) => ({ default: m.StudentPublicProfilePage })));
const QAListPage = lazy(() => import('../pages/CourseQA/QAListPage').then((m) => ({ default: m.QAListPage })));
const QAThreadPage = lazy(() => import('../pages/CourseQA/QAThreadPage').then((m) => ({ default: m.QAThreadPage })));
const TeacherQAInboxPage = lazy(() => import('../pages/CourseQA/TeacherQAInboxPage').then((m) => ({ default: m.TeacherQAInboxPage })));
const SummariesFeedPage = lazy(() => import('../pages/Summaries/SummariesFeedPage').then((m) => ({ default: m.SummariesFeedPage })));
const SummaryDetailPage = lazy(() => import('../pages/Summaries/SummaryDetailPage').then((m) => ({ default: m.SummaryDetailPage })));
const TeacherModerationQueuePage = lazy(() => import('../pages/Summaries/TeacherModerationQueuePage').then((m) => ({ default: m.TeacherModerationQueuePage })));
const LeaderboardPage = lazy(() => import('../pages/Summaries/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })));
const UploadSummaryPage = lazy(() => import('../pages/Summaries/UploadSummaryPage').then((m) => ({ default: m.UploadSummaryPage })));
const CourseCommunityPickerPage = lazy(() => import('../pages/CourseCommunity/CourseCommunityPickerPage').then((m) => ({ default: m.CourseCommunityPickerPage })));

// Heavy: LiveKit SDK is code-split so it never loads on regular pages
const LiveRoomPage = lazy(() =>
  import('../pages/LiveLectures/LiveRoomPage').then((m) => ({ default: m.LiveRoomPage }))
);

// Teacher Dashboard Pages
const DashboardLayout = lazy(() => import('../pages/Dashboard/DashboardLayout').then((m) => ({ default: m.DashboardLayout })));
const DashboardOverviewPage = lazy(() => import('../pages/Dashboard/DashboardOverviewPage').then((m) => ({ default: m.DashboardOverviewPage })));
const DashboardCoursesPage = lazy(() => import('../pages/Dashboard/DashboardCoursesPage').then((m) => ({ default: m.DashboardCoursesPage })));
const ManageCurriculumPage = lazy(() => import('../pages/Dashboard/ManageCurriculumPage').then((m) => ({ default: m.ManageCurriculumPage })));
const DashboardMaterialsPage = lazy(() => import('../pages/Dashboard/DashboardMaterialsPage').then((m) => ({ default: m.DashboardMaterialsPage })));
const DashboardPaymentsPage = lazy(() => import('../pages/Dashboard/DashboardPaymentsPage').then((m) => ({ default: m.DashboardPaymentsPage })));
const DashboardExamsPage = lazy(() => import('../pages/Dashboard/DashboardExamsPage').then((m) => ({ default: m.DashboardExamsPage })));
const DashboardQuestionsPage = lazy(() => import('../pages/Dashboard/DashboardQuestionsPage').then((m) => ({ default: m.DashboardQuestionsPage })));
const DashboardSubmissionsPage = lazy(() => import('../pages/Dashboard/DashboardSubmissionsPage').then((m) => ({ default: m.DashboardSubmissionsPage })));
const DashboardStudentSearchPage = lazy(() => import('../pages/Dashboard/DashboardStudentSearchPage').then((m) => ({ default: m.DashboardStudentSearchPage })));
const DashboardStudentsBacklogPage = lazy(() => import('../pages/Dashboard/DashboardStudentsBacklogPage').then((m) => ({ default: m.DashboardStudentsBacklogPage })));
const DashboardStudentReportsPage = lazy(() => import('../pages/Dashboard/DashboardStudentReportsPage').then((m) => ({ default: m.DashboardStudentReportsPage })));
const AdminTeachersPage = lazy(() => import('../pages/Dashboard/AdminTeachersPage').then((m) => ({ default: m.AdminTeachersPage })));
const AdminTeacherDetailPage = lazy(() => import('../pages/Dashboard/AdminTeacherDetailPage').then((m) => ({ default: m.AdminTeacherDetailPage })));
const DashboardTasksPage = lazy(() => import('../pages/Dashboard/DashboardTasksPage').then((m) => ({ default: m.DashboardTasksPage })));
const DashboardStudentAddPage = lazy(() => import('../pages/Dashboard/DashboardStudentAddPage').then((m) => ({ default: m.DashboardStudentAddPage })));
const CustomizeVideoPage = lazy(() => import('../pages/Dashboard/CustomizeVideoPage').then((m) => ({ default: m.CustomizeVideoPage })));
const CourseStudentsPage = lazy(() => import('../pages/Dashboard/CourseStudentsPage').then((m) => ({ default: m.CourseStudentsPage })));
const HomeworkSubmissionsPage = lazy(() => import('../pages/Dashboard/HomeworkSubmissionsPage').then((m) => ({ default: m.HomeworkSubmissionsPage })));
const DashboardHomeworksPage = lazy(() => import('../pages/Dashboard/DashboardHomeworksPage').then((m) => ({ default: m.DashboardHomeworksPage })));
const AdminAvatarsPage = lazy(() => import('../pages/Dashboard/AdminAvatarsPage').then((m) => ({ default: m.default })));
const AdminFramesPage = lazy(() => import('../pages/Dashboard/AdminFramesPage').then((m) => ({ default: m.default })));

// Error Pages — kept static so 404 renders instantly even on cold cache
import { ForbiddenPage } from '../pages/Errors/ForbiddenPage';
import { NotFoundPage } from '../pages/Errors/NotFoundPage';

/** Full viewport loader for routes outside the public layout (dashboard, etc.). */
const RouteFallback: React.FC = () => (
  <PageLoader fullscreen label="جاري تحميل الصفحة…" />
);

/** Keep navigation chrome visible and center the loader in the available page. */
const PublicRouteFallback: React.FC = () => (
  <PageLoader className="min-h-[calc(100vh-10rem)]" label="جاري تحميل الصفحة…" />
);

// Public Layout Container
const PublicLayout: React.FC = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-transparent text-ivory">
      <Navbar />
      <LearningReminderBar />
      <CartDrawer />
      <main className="flex-1 flex flex-col">
        <Suspense fallback={<PublicRouteFallback />}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export const AppRouter: React.FC = () => {
  return (
    <>
      {/* Global RTL scroll progress bar — works across all layouts/pages */}
      <ScrollProgressBar />
      <ConnectivityStatus />
      {/* Adhkar & Duas: global Dua toast scheduler (suppressed during exams/quizzes/lectures) */}
      <DuaToastProvider />
      {/* Smooth scroll-to-top on route change (pathname-level only) */}
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
      <Routes>
      {/* ─── Public Layout Routes ────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailsPage />} />

        {/* Adhkar & Duas — public, guests + authenticated users */}
        <Route path="/adhkar" element={<AdhkarPage />} />

        {/* Analytics & Stats Aliases — smart routing by role */}
        <Route path="/analytics" element={<AnalyticsRedirect />} />
        <Route path="/performance" element={<AnalyticsRedirect />} />
        <Route path="/stats" element={<AnalyticsRedirect />} />
        <Route path="/statistics" element={<AnalyticsRedirect />} />

        {/* Auth Flow — guests only: redirect logged-in users to their home */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route path="/register" element={<Navigate to="/auth/register" replace />} />
        <Route
          path="/auth/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />

        {/* Protected Student Routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-courses"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyCoursesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-materials"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyMaterialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-payments"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyPaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/learn"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <LessonPlayerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/learn/homework/:lessonId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <HomeworkSolvePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/learn/homework/:lessonId/result/:attemptId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <HomeworkResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/learn/quiz/:lessonId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <QuizSolvePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes/attempts/:attemptId/result"
          element={<ProtectedRoute allowedRoles={['STUDENT']}><QuizResultPage /></ProtectedRoute>}
        />
        <Route
          path="/my-performance"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyPerformancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-results"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-mistakes"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyMistakesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-mistakes/practice"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MistakePracticeExamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mistakes/practice"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MistakePracticeExamPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-homeworks"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentHomeworkResultsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-planner"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudyPlannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-backlog"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyBacklogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/exams"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <CourseExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/attempt"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ExamAttemptPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/attempts/:attemptId/result"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <ExamResultPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/my-attempts"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <MyAttemptsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:examId/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <ExamLeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-rankings"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <ExamRankingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live-lectures"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <StudentLiveLecturesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-lectures/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <LiveLectureDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-lectures/:id/room"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <React.Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-transparent">
                    <PageLoader label="جاري تحميل غرفة المحاضرة…" />
                  </div>
                }
              >
                <LiveRoomPage />
              </React.Suspense>
            </ProtectedRoute>
          }
        />

        <Route
          path="/challenges"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ChallengesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ChallengePlayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/challenges/:id/result"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ChallengeResultPage />
            </ProtectedRoute>
          }
        />

        {/* Course Q&A Routes */}
        <Route
          path="/qa"
          element={<ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}><QAListPage /></ProtectedRoute>}
        />
        <Route
          path="/courses/:courseId/qa"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <QAListPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/qa/:questionId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <QAThreadPage />
            </ProtectedRoute>
          }
        />
        {/* Summaries Routes */}
        <Route
          path="/summaries"
          element={<ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}><SummariesFeedPage /></ProtectedRoute>}
        />
        <Route
          path="/summaries/leaderboard"
          element={<ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}><LeaderboardPage /></ProtectedRoute>}
        />
        <Route
          path="/summaries/:id"
          element={<ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}><SummaryDetailPage /></ProtectedRoute>}
        />
        <Route
          path="/courses/:courseId/summaries"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <SummariesFeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/summaries/leaderboard"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <LeaderboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/summaries/:id"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <SummaryDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses/:courseId/summaries/upload"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <UploadSummaryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/students/:profileId"
          element={
            <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
              <StudentPublicProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shop/avatars"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <AvatarShopPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shop/frames"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <FrameShopPage />
            </ProtectedRoute>
          }
        />

        {/* Parent Portal — OTP login with the guardian phone registered by the student */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ParentDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Errors */}
        <Route path="/403" element={<ForbiddenPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/verify-certificate/:code" element={<VerifyCertificatePage />} />
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ─── Teacher Dashboard Layout Routes ─────────────────────────── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard/overview" replace />} />
        <Route path="overview" element={<DashboardOverviewPage />} />
        <Route path="tasks" element={<DashboardTasksPage />} />
        <Route path="courses" element={<DashboardCoursesPage />} />
        <Route path="live-lectures" element={<TeacherLiveLecturesPage />} />
        <Route path="courses/:id/curriculum" element={<ManageCurriculumPage />} />
        <Route path="materials" element={<DashboardMaterialsPage />} />
        <Route path="courses/:id/students" element={<CourseStudentsPage />} />
        <Route path="courses/:id/video" element={<CustomizeVideoPage />} />
        <Route path="payments" element={<DashboardPaymentsPage />} />
        <Route path="exams" element={<DashboardExamsPage />} />
        <Route path="exams/:id/questions" element={<DashboardQuestionsPage />} />
        <Route path="exams/:id/submissions" element={<DashboardSubmissionsPage />} />
        <Route path="students/search" element={<DashboardStudentSearchPage />} />
        <Route path="students/monitor" element={<DashboardStudentMonitorPage />} />
        <Route path="students/backlog" element={<DashboardStudentsBacklogPage />} />
        <Route path="students/reports" element={<DashboardStudentReportsPage />} />
        <Route path="students/add" element={<DashboardStudentAddPage />} />
        <Route
          path="teachers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="teachers/:teacherId"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminTeacherDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="avatars"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminAvatarsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="frames"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminFramesPage />
            </ProtectedRoute>
          }
        />
        <Route path="question-bank" element={<QuestionBankPage />} />
        <Route path="analytics" element={<TeacherAnalyticsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="courses/:id/analytics" element={<CourseAnalyticsPage />} />
        <Route path="taxonomy" element={<DashboardTaxonomyPage />} />
        <Route path="homeworks" element={<DashboardHomeworksPage />} />
        <Route path="homework/:homeworkId/submissions" element={<HomeworkSubmissionsPage />} />
        <Route path="qa-inbox" element={<TeacherQAInboxPage />} />
        <Route path="summaries-moderation" element={<TeacherModerationQueuePage />} />
      </Route>
      </Routes>
      </Suspense>
    </>
  );
};
