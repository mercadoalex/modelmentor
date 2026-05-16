import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { RubricCriterion, PerformanceLevel } from '@/data/lessonPlans/types';

interface RubricTableProps {
  rubric: RubricCriterion[];
}

const LEVELS: PerformanceLevel[] = ['beginning', 'developing', 'proficient', 'advanced'];

export function RubricTable({ rubric }: RubricTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">
              {t('lessonPlans.ui.rubric')}
            </TableHead>
            {LEVELS.map((level) => (
              <TableHead key={level} className="min-w-[150px]">
                {t(`lessonPlans.ui.levels.${level}`)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rubric.map((criterion, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{criterion.criterion}</TableCell>
              {LEVELS.map((level) => (
                <TableCell key={level} className="text-sm">
                  {criterion.levels[level]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
