import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, A11y } from 'swiper/modules';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface CourseSliderProps {
  children: React.ReactNode[];
  autoplay?: boolean;
}

export const CourseSlider: React.FC<CourseSliderProps> = ({ children, autoplay = true }) => {
  return (
    <div className="course-slider group/slider relative">
      <Swiper
        modules={[Navigation, Pagination, Autoplay, A11y]}
        dir="rtl"
        // Selector-based navigation: resolved at init from the real DOM,
        // immune to ref timing / re-render issues that broke the arrows.
        navigation={{
          prevEl: '.course-slider-prev',
          nextEl: '.course-slider-next',
        }}
        spaceBetween={28}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
          1280: { slidesPerView: 3 },
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        autoplay={
          autoplay
            ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
            : false
        }
        loop={children.length > 3}
        speed={700}
        grabCursor
        observer
        observeParents
        className="!pb-16"
      >
        {children.map((child, idx) => (
          <SwiperSlide key={idx} className="!h-auto">
            {child}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Prev / Next buttons — enhanced with glass effect */}
      <button
        type="button"
        aria-label="السابق"
        className="course-slider-prev absolute top-1/2 -translate-y-1/2 right-0 lg:-right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]/90 text-[var(--primary)] shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] cursor-pointer opacity-0 group-hover/slider:opacity-100"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <button
        type="button"
        aria-label="التالي"
        className="course-slider-next absolute top-1/2 -translate-y-1/2 left-0 lg:-left-6 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)]/90 text-[var(--primary)] shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] cursor-pointer opacity-0 group-hover/slider:opacity-100"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Custom pagination styling */}
      <style>{`
        .course-slider .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: var(--ink-muted);
          opacity: 0.3;
          transition: all 0.3s ease;
        }
        .course-slider .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 99px;
          background: var(--primary);
          opacity: 1;
        }
        .course-slider .swiper-pagination {
          bottom: 0 !important;
        }
      `}</style>
    </div>
  );
};
