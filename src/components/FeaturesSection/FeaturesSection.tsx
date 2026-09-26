import { featuresData } from './featuresData';
import FeatureCard from './FeatureCard';
import { SectionHeader } from '../ui/SectionHeader';
import { useTheme } from '../../contexts/ThemeProvider';
import './FeaturesSection.css';

export default function FeaturesSection() {
  const { theme } = useTheme();

  return (
    <section className="features-section" dir="rtl" key={theme}>
      <SectionHeader
        eyebrow="مميزات المنصة"
        shape="circle"
        fontMix
        title="ماذا تقدم لك منصة سند؟"
        description="أدوات ذكية ومتابعة متواصلة لتسهيل رحلتك التعليمية وضمان تفوقك"
        className="mb-12"
      />
      <div className="features-grid">
        {featuresData.map(({ id, ...feature }) => (
          <FeatureCard key={id} {...feature} />
        ))}
      </div>
    </section>
  );
}
