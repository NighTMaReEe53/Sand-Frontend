import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Timer,
  Sparkles,
  Coffee,
  Brain,
  Volume2,
} from 'lucide-react';
import { StudyTask } from '../../../api/phase2.api';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { playSuccessSound, playNotificationSound } from '../usePlannerAudioAndNotifications';

interface FocusPomodoroModalProps {
  task: StudyTask | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleteTask: (task: StudyTask) => void;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODE_TIMES: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const FocusPomodoroModal: React.FC<FocusPomodoroModalProps> = ({
  task,
  isOpen,
  onClose,
  onCompleteTask,
}) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.work);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const timerRef = useRef<number | null>(null);

  // Reset timer on mode change or task change
  useEffect(() => {
    setTimeLeft(MODE_TIMES[mode]);
    setIsActive(false);
  }, [mode, task]);

  // Countdown loop
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playNotificationSound();
      if (mode === 'work') {
        setSessionsCompleted((prev) => prev + 1);
        playSuccessSound();
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  if (!isOpen || !task) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalModeTime = MODE_TIMES[mode];
  const progressPercent = ((totalModeTime - timeLeft) / totalModeTime) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title="مؤقت التركيز الذكي (Pomodoro)"
      description="ركز في إنجاز هذه المهمة دون أي مشتتات"
    >
      <div className="space-y-6 pt-2 text-center select-none">
        {/* Task Info Pill */}
        <div className="p-3.5 rounded-2xl bg-surface border border-gold-500/30 text-right space-y-1">
          <span className="text-[10px] font-bold text-gold-400">المهمة المستهدفة:</span>
          <h3 className="text-sm font-bold text-ivory line-clamp-2">{task.title}</h3>
          {task.description && (
            <p className="text-[11px] text-ivory-muted line-clamp-1">{task.description}</p>
          )}
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-surface border border-surface-border">
          <button
            type="button"
            onClick={() => setMode('work')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'work'
                ? 'bg-gold-500 text-bg-base shadow-sm'
                : 'text-ivory-muted hover:text-ivory'
            }`}
          >
            <Brain className="w-4 h-4" />
            تركيز (25 د)
          </button>
          <button
            type="button"
            onClick={() => setMode('shortBreak')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'shortBreak'
                ? 'bg-emerald-500 text-bg-base shadow-sm'
                : 'text-ivory-muted hover:text-ivory'
            }`}
          >
            <Coffee className="w-4 h-4" />
            راحة قصيرة (5 د)
          </button>
          <button
            type="button"
            onClick={() => setMode('longBreak')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'longBreak'
                ? 'bg-sky-500 text-bg-base shadow-sm'
                : 'text-ivory-muted hover:text-ivory'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            راحة طويلة (15 د)
          </button>
        </div>

        {/* Big Circular Animated Timer Display */}
        <div className="relative w-52 h-52 mx-auto flex flex-col items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-surface stroke-current"
              strokeWidth="6"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-500 ${
                mode === 'work'
                  ? 'text-gold-400'
                  : mode === 'shortBreak'
                  ? 'text-emerald-400'
                  : 'text-sky-400'
              } stroke-current`}
              strokeWidth="6"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Central Time Display */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-black font-display text-ivory tracking-widest tabular-nums">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[11px] text-ivory-muted mt-1 font-cairo">
              {mode === 'work' ? 'وقت المذاكرة والتركيز' : 'وقت الاستراحة'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTimeLeft(MODE_TIMES[mode])}
            title="إعادة ضبط المؤقت"
            className="shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            size="md"
            onClick={() => setIsActive(!isActive)}
            className="px-6 shadow-sm"
            leftIcon={isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          >
            {isActive ? 'إيقاف مؤقت' : 'ابدأ الجلسة'}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              onCompleteTask(task);
              onClose();
            }}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 shadow-sm"
            title="إنهاء وإكمال المهمة"
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Sessions Counter */}
        {sessionsCompleted > 0 && (
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            أنجزت {sessionsCompleted} جلسة تركيز في هذه الجولة!
          </div>
        )}
      </div>
    </Modal>
  );
};
