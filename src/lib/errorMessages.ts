/**
 * ترجمة رسائل الأخطاء القادمة من الباك إند (إنجليزي) إلى العربية
 * حتى لا يرى الطالب أي رسالة إنجليزية.
 */

type Rule = [RegExp, string | ((...args: string[]) => string)];

const RULES: Rule[] = [
  // ─── التحديات ───────────────────────────────────────────────
  [/^You cannot challenge yourself\.$/, 'لا يمكنك تحدي نفسك!'],
  [/^Both students must be actively enrolled in the same course\.$/, 'يجب أن يكون الطرفان مشتركين بنشاط في نفس الكورس.'],
  [/^Opponent must be a student\.$/, 'الخصم يجب أن يكون طالباً.'],
  [/^Question count must be between (\d+) and (\d+)\.$/, (_m, a, b) => `عدد الأسئلة يجب أن يكون بين ${a} و ${b}.`],
  [/^Duration must be between (\d+) and (\d+) seconds\.$/, (_m, a, b) => `المدة يجب أن تكون بين ${a} و ${b} ثانية.`],
  [/^The question bank needs at least (\d+) questions\.$/, (_m, n) => `بنك أسئلة هذا الكورس يحتاج إلى ${n} أسئلة على الأقل.`],
  [/^This invitation has expired\.$/, 'انتهت صلاحية هذه الدعوة.'],
  [/^This challenge cannot be accepted anymore\.$/, 'لم يعد بإمكانك قبول هذا التحدي.'],
  [/^This challenge can no longer be rejected\.$/, 'لم يعد بإمكانك رفض هذا التحدي.'],
  [/^You cannot reject your own challenge\.$/, 'لا يمكنك رفض تحديك الخاص!'],
  [/^Waiting for your opponent to respond\.$/, 'بانتظار رد الخصم…'],
  [/^The challenge is not ready to start\.$/, 'التحدي غير جاهز للبدء بعد.'],
  [/^This challenge has expired\.$/, 'انتهت صلاحية هذا التحدي.'],
  [/^The challenge is not in progress\.$/, 'التحدي ليس جارياً الآن.'],
  [/^Time is up.*$/, 'انتهى الوقت — لم تعد الإجابات مقبولة.'],
  [/^This question is not part of your challenge set\.$/, 'هذا السؤال ليس ضمن مجموعة أسئلتك.'],
  [/^You already answered this question\.$/, 'لقد أجبت على هذا السؤال بالفعل.'],
  [/^Question no longer exists\.$/, 'هذا السؤال لم يعد موجوداً.'],
  [/^Challenge not found\.$/, 'التحدي غير موجود.'],
  [/^You are not a participant in this challenge\.$/, 'أنت لست مشاركاً في هذا التحدي.'],
  [/^You must be actively enrolled in this course\.$/, 'يجب أن تكون مشتركاً بنشاط في هذا الكورس.'],
  [/^You already finished\.$/, 'لقد أنهيت جزئك بالفعل.'],

  // ─── المدفوعات والاشتراكات ──────────────────────────────────
  [/^Payment has already been reviewed or is no longer pending\.$/, 'تم مراجعة هذه الدفعة بالفعل أو أنها لم تعد معلقة.'],
  [/^You already have an active or pending enrollment for one of these courses\.$/, 'لديك اشتراك نشط أو قيد المراجعة بالفعل لأحد هذه الكورسات.'],
  [/^Cannot cancel payment after a receipt has already been submitted\.$/, 'لا يمكن إلغاء الدفعة بعد رفع الإيصال.'],
  [/^Cannot cancel a payment with status "([^"]+)"\.$/, 'لا يمكن إلغاء هذه الدفعة بحالتها الحالية.'],
  [/^Only rejected enrollments can be retried\. Current status is "([^"]+)"\.$/, 'يمكن إعادة المحاولة فقط للاشتراكات المرفوضة.'],
  [/^Course is no longer available for enrollment\.$/, 'هذا الكورس غير متاح للاشتراك حالياً.'],
  [/^Payment record not found\.$/, 'سجل الدفعة غير موجود.'],
  [/^Payment not found\.$/, 'الدفع غير موجود.'],
  [/^You do not have permission to submit a receipt for this payment\.$/, 'لا تملك صلاحية رفع إيصال لهذه الدفعة.'],
  [/^Cannot submit receipt for payment with status "([^"]+)"\.$/, 'لا يمكن رفع إيصال لدفعة بحالتها الحالية.'],
  [/^Receipt image file is required\.$/, 'يجب رفع صورة الإيصال.'],
  [/^Invalid file type\. Only JPEG, PNG, and WebP images are allowed for receipts\.$/, 'نوع الملف غير مدعوم — المسموح فقط JPEG أو PNG أو WebP للإيصالات.'],
  [/^Receipt image size exceeds the 5MB limit\.$/, 'حجم صورة الإيصال يتجاوز 5 ميجابايت.'],
  [/^Duplicate receipt image detected!.*$/s, 'تم اكتشاف إيصال مكرر! هذه الصورة استُخدمت من قبل في دفعة أخرى.'],
  [/^This payment request has expired\. Please initiate a new checkout\.$/, 'انتهت صلاحية طلب الدفع — يرجى بدء عملية جديدة.'],
  [/^Too many receipt submissions for this enrollment\..*$/s, 'محاولات كثيرة جداً لرفع الإيصال لهذا الاشتراك — الحد الأقصى 3 محاولات في الساعة.'],
  [/^Too many receipt submissions across your account\..*$/s, 'محاولات كثيرة جداً من حسابك — الحد الأقصى 10 محاولات في الساعة.'],
  [/^Teachers cannot purchase their own courses\.$/, 'لا يمكن للمدرس شراء كورسه الخاص.'],
  [/^Cannot checkout for a course that is not published yet\.$/, 'لا يمكن الشراء في كورس غير منشور.'],
  [/^This is a free course\..*$/s, 'هذا كورس مجاني — يمكنك الاشتراك فيه مجاناً مباشرة.'],
  [/^The final amount is invalid.*$/i, 'المبلغ النهائي غير صالح بعد تطبيق الخصم.'],

  // ─── الكورسات ───────────────────────────────────────────────
  [/^Course not found\.$/, 'الكورس غير موجود.'],
  [/^Already enrolled in this course\./i, 'أنت مشترك في هذا الكورس بالفعل.'],
  [/^Enrollment is only allowed for published courses\.?$/i, 'الاشتراك متاح فقط للكورسات المنشورة.'],
  [/^Free enrollment is only available for free courses\.?$/i, 'الاشتراك المجاني متاح فقط للكورسات المجانية.'],

  // ─── عام / مصادقة ───────────────────────────────────────────
  [/^Invalid credentials$/i, 'بيانات الدخول غير صحيحة.'],
  [/^Unauthorized$/i, 'غير مصرح — يرجى تسجيل الدخول.'],
  [/^Forbidden resource$/i, 'ليس لديك صلاحية للوصول.'],
  [/^Student profile not found\.$/, 'لم يتم العثر على ملف الطالب.'],
  [/^Not Found$/, 'العنصر غير موجود.'],

  // ─── أخطاء قاعدة البيانات / غير متوقعة ──────────────────────
  [/^Unique constraint failed/i, 'هذه البيانات مستخدمة بالفعل — جرّب مرة أخرى.'],
  [/^Failed to prepare the bot player\.$/, 'تعذر تجهيز البوت — حاول مرة أخرى.'],

  // ─── أخطاء التحقق من البيانات (ValidationPipe) ──────────────
  [/^property (\w+) should not exist/, 'بيانات غير صالحة — أعد تحميل الصفحة وحاول مجدداً.'],
  [/^(\w+) should not be empty/, 'حقل مطلوب فارغ — أكمل جميع البيانات.'],
  [/^(\w+) must be a UUID/, 'معرّف غير صالح — أعد تحميل الصفحة وحاول مجدداً.'],
  [/^(\w+) must be an? integer number/, 'قيمة رقمية غير صالحة.'],
  [/^(\w+) must not be greater than (\d+)/, 'القيمة المُدخلة أكبر من الحد المسموح.'],
  [/^(\w+) must not be less than (\d+)/, 'القيمة المُدخلة أقل من الحد المسموح.'],
];

/** يترجم رسالة الباك إند إذا وُجدت في القاموس، وإلا يعيدها كما هي */
export const translateBackendMessage = (message: string): string => {
  if (!message) return message;
  for (const [pattern, replacement] of RULES) {
    if (pattern.test(message)) {
      return typeof replacement === 'function'
        ? (message.replace(pattern as RegExp, replacement as any))
        : replacement;
    }
  }
  return message;
};

interface ApiErrorLike {
  response?: {
    status?: number;
    data?: { message?: string | string[] } & Record<string, unknown>;
  };
  message?: string;
}

/**
 * يستخرج رسالة الخطأ من استجابة الـ API ويترجمها للعربية.
 * إذا لم تتطابق مع أي ترجمة معروفة تُرجع الرسالة العربية الاحتياطية.
 */
export const getApiErrorMessage = (err: unknown, fallback = 'حدث خطأ ما — حاول مرة أخرى'): string => {
  const e = err as ApiErrorLike;
  const data = e?.response?.data;
  const status = e?.response?.status;

  // رسائل التحقق (class-validator) تأتي كمصفوفة نصوص إنجليزية
  if (Array.isArray(data?.message)) return 'بيانات غير صحيحة — تأكد من المدخلات وحاول مجدداً.';

  if (typeof data?.message === 'string') {
    const translated = translateBackendMessage(data.message);
    // رسالة غير مترجمة وإنجليزية؟ نعرض الرسالة العربية الاحتياطية
    if (translated === data.message && /[a-zA-Z]{4,}/.test(data.message)) return fallback;
    return translated;
  }

  if (status === 0 || (e as any)?.code === 'ERR_NETWORK') return 'تعذر الاتصال بالسيرفر — تحقق من اتصالك بالإنترنت.';
  if (status === 500 || status === 502 || status === 503) return 'خطأ في السيرفر — حاول مرة أخرى بعد قليل.';
  if (!data && typeof e?.message === 'string' && e.message.includes('Network')) {
    return 'تعذر الاتصال بالسيرفر — تحقق من اتصالك بالإنترنت.';
  }
  return fallback;
};
