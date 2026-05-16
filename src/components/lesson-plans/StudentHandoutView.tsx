import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageSquare, PenLine } from 'lucide-react';
import type { StudentHandout } from '@/data/lessonPlans/types';

interface StudentHandoutViewProps {
  handout: StudentHandout;
}

export function StudentHandoutView({ handout }: StudentHandoutViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 print:space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{handout.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{handout.instructions}</p>
      </div>

      {/* Workflow Steps */}
      {handout.workflowSteps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('lessonPlans.ui.procedure')}
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
            {handout.workflowSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Sections */}
      {handout.sections.map((section, index) => (
        <Card key={index} className="print:border print:shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompts */}
            <div className="space-y-2">
              {section.prompts.map((prompt, pIndex) => (
                <div key={pIndex} className="flex items-start gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{prompt}</span>
                </div>
              ))}
            </div>

            {/* Reflection Questions */}
            {section.reflectionQuestions && section.reflectionQuestions.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Reflection
                </p>
                {section.reflectionQuestions.map((question, qIndex) => (
                  <div key={qIndex} className="flex items-start gap-2 text-sm italic">
                    <PenLine className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{question}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Response Space Indicator */}
            {section.hasResponseSpace && (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 mt-2">
                <Badge variant="outline" className="text-xs">
                  <PenLine className="h-3 w-3 mr-1" />
                  {t('lessonPlans.ui.handout')} — Response Space
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
