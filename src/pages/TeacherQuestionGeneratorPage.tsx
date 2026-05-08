import { AppLayout } from '@/components/layouts/AppLayout';
import { TeacherQuestionGenerator } from '@/components/teacher/TeacherQuestionGenerator';

export default function TeacherQuestionGeneratorPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        <TeacherQuestionGenerator />
      </div>
    </AppLayout>
  );
}