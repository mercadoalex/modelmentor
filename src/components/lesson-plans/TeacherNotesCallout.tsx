import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lightbulb, MessageCircle } from 'lucide-react';
import type { TeacherNotes } from '@/data/lessonPlans/types';

interface TeacherNotesCalloutProps {
  teacherNotes: TeacherNotes;
}

export function TeacherNotesCallout({ teacherNotes }: TeacherNotesCalloutProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Misconceptions */}
      {teacherNotes.misconceptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Common Misconceptions
          </h4>
          <div className="space-y-3">
            {teacherNotes.misconceptions.map((item, index) => (
              <Alert key={index} className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900 dark:text-amber-100">
                  {item.misconception}
                </AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Correction:</span> {item.correction}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Discussion Prompts */}
      {teacherNotes.discussionPrompts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-500" />
            Discussion Prompts
          </h4>
          <div className="space-y-4">
            {teacherNotes.discussionPrompts.map((group, index) => (
              <div key={index} className="space-y-2">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {group.phase}
                </p>
                <div className="space-y-2">
                  {group.prompts.map((prompt, pIndex) => (
                    <div
                      key={pIndex}
                      className="flex items-start gap-2 p-2 rounded bg-blue-50 dark:bg-blue-950 text-sm"
                    >
                      <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{prompt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classroom Tips */}
      {teacherNotes.classroomTips.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-green-500" />
            Classroom Tips
          </h4>
          <ul className="space-y-2">
            {teacherNotes.classroomTips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-2 p-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 text-sm"
              >
                <span className="text-green-600 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
