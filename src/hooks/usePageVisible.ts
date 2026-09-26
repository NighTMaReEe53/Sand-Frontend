/**
 * usePageVisible — يرجع true لما التبويب مرئي وfalse لما المستخدم يحوّله أو يعمل minimize.
 * يُستخدم كـ condition في الـ refetchInterval لوقف الـ polling غير الضروري.
 */
import { useEffect, useState } from 'react';

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible');

  useEffect(() => {
    const handler = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  return visible;
}
