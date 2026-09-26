import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactionsApi } from '../../api/reactions.api';

const EMOJI_MAP: Record<string, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

const REACTION_TYPES = ['LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY'];

export function ReactionPicker({
  targetType,
  targetId,
  summary,
}: {
  targetType: string;
  targetId: string;
  summary: Record<string, number>;
  currentUserReaction?: string | null;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const queryClient = useQueryClient();

  const reactMutation = useMutation({
    mutationFn: (type: string) => reactionsApi.react({ targetType, targetId, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', targetType, targetId] });
    },
  });

  const unreactMutation = useMutation({
    mutationFn: () => reactionsApi.unreact(targetType, targetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', targetType, targetId] });
    },
  });

  const totalReactions = Object.values(summary).reduce((a, b) => a + b, 0);

  return (
    <div className="relative inline-flex items-center gap-2">
      <div
        className="relative"
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        <button className="text-sm text-white/50 hover:text-white/80 bg-white/5 px-3 py-1 rounded-full">
          😊 تفاعل
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-2 flex gap-1 bg-gray-900 border border-white/10 rounded-full px-2 py-1 shadow-lg z-10">
            {REACTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => {
                  reactMutation.mutate(type);
                  setShowPicker(false);
                }}
                className="text-xl hover:scale-125 transition-transform p-1"
                title={type}
              >
                {EMOJI_MAP[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {totalReactions > 0 && (
        <div className="flex items-center gap-1 text-xs text-white/50">
          {Object.entries(summary)
            .filter(([, count]) => count > 0)
            .map(([type, count]) => (
              <span key={type} className="bg-white/10 px-1.5 py-0.5 rounded-full">
                {EMOJI_MAP[type]} {count}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
