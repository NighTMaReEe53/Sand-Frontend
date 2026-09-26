import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ExamLeaderboard } from '../../components/exams/ExamLeaderboard';

export const ExamLeaderboardPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  if (!examId) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 text-right space-y-6">
      <ExamLeaderboard examId={examId} />

      <Link
        to="/my-courses"
        className="inline-flex items-center gap-2 text-xs text-ivory-muted hover:text-gold-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        رجوع
      </Link>
    </div>
  );
};
