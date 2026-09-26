import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../api/axiosInstance';

interface Course {
  id: string;
  title: string;
}

export function CourseSelect({
  value,
  onChange,
  placeholder = 'اختر دورة...',
}: {
  value: string;
  onChange: (courseId: string) => void;
  placeholder?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['myCourses'],
    queryFn: async () => {
      const res = await axiosInstance.get('/enrollments/my-courses');
      return res.data;
    },
  });

  const courses = (data?.courses || data || []) as Course[];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-ivory w-full"
    >
      <option value="">{placeholder}</option>
      {courses.map((c: Course) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </select>
  );
}
