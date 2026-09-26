import React from 'react';

interface State {
  error: Error | null;
}

/**
 * Global safety net — any uncaught render error shows a readable card with the
 * message instead of a blank white page. The real error stays in the console.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Full details in devtools for debugging
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div dir="rtl" className="min-h-dvh flex items-center justify-center bg-[var(--bg)] p-6">
          <div className="max-w-lg w-full space-y-4 rounded-2xl border border-red-500/30 bg-surface-card p-6 text-right shadow-xl">
            <h1 className="text-lg font-bold font-amiri text-red-400">حدث خطأ غير متوقع</h1>
            <p className="text-xs leading-relaxed text-ivory-muted">
              تعطلت هذه الصفحة بسبب خطأ برمجي. تفاصيل الخطأ أدناه — أرسل لقطة شاشة لها لحل المشكلة.
            </p>
            <pre
              dir="ltr"
              className="max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-left text-[11px] leading-relaxed text-red-300 whitespace-pre-wrap break-words"
            >
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack?.slice(0, 1500)}
            </pre>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => this.setState({ error: null })}
                className="rounded-xl border border-surface-border px-4 py-2 text-xs font-bold text-ivory-muted hover:text-ivory transition-colors"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-gold-gradient px-4 py-2 text-xs font-bold text-bg"
              >
                تحديث الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
