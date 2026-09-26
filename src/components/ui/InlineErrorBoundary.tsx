import React from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/** يمنع انهيار الصفحة كاملة عند فشل جزء معزول (مثل محتوى المودال) */
export class InlineErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[InlineErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-sm font-bold text-red-400">تعذر عرض هذا المحتوى</p>
          <p className="text-xs text-ivory-muted">حاول إغلاق النافذة وفتحها مرة أخرى.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
