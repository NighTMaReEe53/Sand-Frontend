import ContentListMockup from './mockups/ContentListMockup';
import ScheduleMockup from './mockups/ScheduleMockup';
import SettingsMockup from './mockups/SettingsMockup';
import MistakesMockup from './mockups/MistakesMockup';
import HomeworkVideoMockup from './mockups/HomeworkVideoMockup';
import ExamQuizMockup from './mockups/ExamQuizMockup';
import ChatSupportMockup from './mockups/ChatSupportMockup';
import LessonTimerMockup from './mockups/LessonTimerMockup';
import ChallengeMockup from './mockups/ChallengeMockup';
import Top3Mockup from './mockups/Top3Mockup';
import SmartSearchMockup from './mockups/SmartSearchMockup';
import SummaryPdfMockup from './mockups/SummaryPdfMockup';
import {
  BookOpen,
  BookX,
  CalendarClock,
  ClipboardList,
  FileDown,
  Lightbulb,
  MonitorPlay,
  Search,
  Swords,
  Timer,
  Trophy,
  Video,
} from 'lucide-react';
import type { Feature } from './types';

// All user-visible strings are Arabic — code stays English (plan language rule).
export const featuresData: Feature[] = [
  // --- existing cards (titles/descriptions localized per plan §2) ---
  {
    id: 'content',
    title: 'محتوى علمي متكامل',
    description: 'كل حاجة محتاجها في مكان واحد',
    color: '#FDBA3B',
    Icon: BookOpen,
    MockupComponent: ContentListMockup,
  },
  {
    id: 'schedule',
    title: 'مواعيد ثابتة',
    description: 'نزول المحاضرات بانتظام',
    color: '#22C55E',
    Icon: CalendarClock,
    MockupComponent: ScheduleMockup,
  },
  {
    id: 'quality',
    title: 'فيديوهات بجودة عالية',
    description: 'جودة متنوعة تناسب الإنترنت بتاعك',
    color: '#3B82F6',
    Icon: MonitorPlay,
    MockupComponent: SettingsMockup,
  },

  // --- new cards ---
  {
    id: 'mistakes',
    title: 'أخطائي',
    description: 'تقدر تعرف الاخطاء اللي غلطها في الامتحانات طول السنة',
    color: '#EF4444',
    Icon: BookX,
    MockupComponent: MistakesMockup,
  },
  {
    id: 'homework-videos',
    title: 'فيديوهات حل الواجب',
    description: 'تقدر تختار السؤال وتشوف حله من غير ما تضيع وقتك',
    color: '#22C55E',
    Icon: Video,
    MockupComponent: HomeworkVideoMockup,
  },
  {
    id: 'exams',
    title: 'امتحانات شاملة',
    description: 'واختبارات داخل كل محاضرة',
    color: '#6366F1',
    Icon: ClipboardList,
    MockupComponent: ExamQuizMockup,
  },
  {
    id: 'lesson-timer',
    title: 'مؤقت المحاضرة',
    description: 'عد تنازلي يوضحلك باقي قد إيه على المحاضرة الجاية',
    color: '#F97316',
    Icon: Timer,
    MockupComponent: LessonTimerMockup,
  },
  {
    id: 'academic-support',
    title: 'دعم علمي و فني',
    description: 'لو عندك أي سؤال جه في بالك وانت بتذاكر',
    color: '#818CF8',
    Icon: Lightbulb,
    MockupComponent: ChatSupportMockup,
  },

  // --- newly requested features ---
  {
    id: 'smart-search',
    title: 'بحث ذكي',
    description: 'دور على أي محاضرة أو سؤال وهيوصلك للنتيجة فورًا',
    color: '#06B6D4',
    Icon: Search,
    MockupComponent: SmartSearchMockup,
  },
  {
    id: 'summaries-pdf',
    title: 'ملخصات و PDFs',
    description: 'كل ملخصات المنهج جاهزة تنزلها وتذاكر منها',
    color: '#D97706',
    Icon: FileDown,
    MockupComponent: SummaryPdfMockup,
  },
  {
    id: 'challenges',
    title: 'تحديات بين الطلبة',
    description: 'نافس زمايلك في تحديات سرعة وحل أسئلة',
    color: '#EC4899',
    Icon: Swords,
    MockupComponent: ChallengeMockup,
  },
  {
    id: 'top-three',
    title: 'أفضل 3 في الامتحانات',
    description: 'تابع ترتيبك بين زمايلك وحاول توصل للأول',
    color: '#F59E0B',
    Icon: Trophy,
    MockupComponent: Top3Mockup,
  },
];
