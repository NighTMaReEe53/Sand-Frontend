import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Web Audio API synthesizer for instant, zero-dependency sound effects
 */
const playTone = (freqs: number[], durations: number[], type: OscillatorType = 'sine', gainVal = 0.15) => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    let startTime = ctx.currentTime;
    freqs.forEach((freq, idx) => {
      const dur = durations[idx] || 0.1;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gainNode.gain.setValueAtTime(gainVal, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + dur);

      startTime += dur * 0.8;
    });
  } catch {
    // Ignore audio context errors if not allowed
  }
};

export const playSuccessSound = () => {
  // Upward melodic chime (C5 -> E5 -> G5 -> C6)
  playTone([523.25, 659.25, 783.99, 1046.5], [0.08, 0.08, 0.1, 0.25], 'triangle', 0.12);
};

export const playNotificationSound = () => {
  // Gentle reminder bell
  playTone([880, 1174.66], [0.12, 0.28], 'sine', 0.15);
};

export const playPopSound = () => {
  playTone([400, 600], [0.04, 0.06], 'sine', 0.08);
};

export const usePlannerNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('study_planner_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  useEffect(() => {
    localStorage.setItem('study_planner_sound_enabled', String(soundEnabled));
  }, [soundEnabled]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      toast.error('متصفحك لا يدعم نظام التنبيهات المباشرة.');
      return false;
    }

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        toast.success('تم تفعيل التنبيهات بنجاح! سنذكرك بمهامك اليومية.');
        if (soundEnabled) playNotificationSound();
        return true;
      } else {
        toast.info('تم رفض الإذن بالتنبيهات. يمكنك تمكينها من إعدادات المتصفح.');
        return false;
      }
    } catch {
      toast.error('حدث خطأ أثناء طلب إذن التنبيهات.');
      return false;
    }
  }, [soundEnabled]);

  const sendBrowserReminder = useCallback(
    (title: string, body: string, icon = '/favicon.ico') => {
      if (soundEnabled) {
        playNotificationSound();
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon,
            dir: 'rtl',
            lang: 'ar',
          });
        } catch {
          // Fallback to in-app toast
          toast.info(`${title}: ${body}`);
        }
      } else {
        toast.info(`${title}: ${body}`);
      }
    },
    [soundEnabled]
  );

  return {
    permission,
    requestPermission,
    sendBrowserReminder,
    soundEnabled,
    setSoundEnabled,
    playSuccess: () => {
      if (soundEnabled) playSuccessSound();
    },
    playPop: () => {
      if (soundEnabled) playPopSound();
    },
  };
};
