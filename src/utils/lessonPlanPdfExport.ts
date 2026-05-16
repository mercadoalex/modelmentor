import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import type { CurriculumLessonPlan } from '@/data/lessonPlans/types';
import type { TFunction } from 'i18next';

// Brand colors
const COLORS = {
  primary: '#2563eb',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
};

const SPACING = {
  pageMargin: 20,
  sectionGap: 12,
  paragraphGap: 8,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function addPageHeader(doc: jsPDF, title: string, gradeBand: string): number {
  let yPos = SPACING.pageMargin;

  // ModelMentor branding
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text('ModelMentor', SPACING.pageMargin, yPos);
  yPos += 10;

  // Plan title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(title, SPACING.pageMargin, yPos);
  yPos += 7;

  // Grade band
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textLight);
  doc.text(gradeBand, SPACING.pageMargin, yPos);
  yPos += 5;

  // Date
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, SPACING.pageMargin, yPos);
  yPos += SPACING.sectionGap;

  // Separator
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(SPACING.pageMargin, yPos, 210 - SPACING.pageMargin, yPos);
  yPos += SPACING.sectionGap;

  return yPos;
}

function addSectionHeading(doc: jsPDF, heading: string, yPos: number): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.text);
  doc.text(heading, SPACING.pageMargin, yPos);
  return yPos + SPACING.paragraphGap;
}

function addParagraph(doc: jsPDF, text: string, yPos: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  const width = 210 - 2 * SPACING.pageMargin;
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, SPACING.pageMargin, yPos);
  return yPos + lines.length * 5 + SPACING.paragraphGap;
}

function addBulletList(doc: jsPDF, items: string[], yPos: number): number {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.text);
  const width = 210 - 2 * SPACING.pageMargin - 5;

  for (const item of items) {
    yPos = checkPageBreak(doc, yPos, 10);
    const lines = doc.splitTextToSize(`• ${item}`, width);
    doc.text(lines, SPACING.pageMargin + 5, yPos);
    yPos += lines.length * 5 + 2;
  }

  return yPos + SPACING.paragraphGap;
}

function checkPageBreak(doc: jsPDF, currentY: number, requiredSpace: number = 30): number {
  if (currentY + requiredSpace > 297 - SPACING.pageMargin) {
    doc.addPage();
    return SPACING.pageMargin;
  }
  return currentY;
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    const pageText = `Page ${i} of ${pageCount}`;
    const textWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (210 - textWidth) / 2, 297 - 10);
    doc.text('ModelMentor - ML Training Platform', SPACING.pageMargin, 297 - 10);
  }
}

/**
 * Export a full lesson plan as PDF
 */
export function exportLessonPlanPDF(plan: CurriculumLessonPlan, t: TFunction): void {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const title = t(`lessonPlans.plans.${plan.slug}.title`, { defaultValue: plan.title });
    const gradeBandLabel = t(`lessonPlans.ui.gradeBands.${plan.gradeBand}`, { defaultValue: plan.gradeBand });

    doc.setProperties({
      title,
      author: 'ModelMentor',
      creator: 'ModelMentor',
    });

    let yPos = addPageHeader(doc, title, gradeBandLabel);

    // Objectives
    yPos = checkPageBreak(doc, yPos, 30);
    yPos = addSectionHeading(doc, t('lessonPlans.ui.objectives', { defaultValue: 'Learning Objectives' }), yPos);
    yPos = addBulletList(doc, plan.objectives, yPos);

    // Standards
    yPos = checkPageBreak(doc, yPos, 20);
    yPos = addSectionHeading(doc, t('lessonPlans.ui.standards', { defaultValue: 'Standards Alignment' }), yPos);
    const standardsText = plan.standards.map((s) => `${s.code} (${s.type}): ${s.name}`);
    yPos = addBulletList(doc, standardsText, yPos);

    // Procedure
    for (const phase of plan.procedure) {
      yPos = checkPageBreak(doc, yPos, 40);
      yPos = addSectionHeading(doc, `${phase.name} (${phase.duration})`, yPos);
      yPos = addBulletList(doc, phase.steps, yPos);
    }

    // Rubric Table
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, t('lessonPlans.ui.rubric', { defaultValue: 'Assessment Rubric' }), yPos);

    const rubricHeaders = [
      'Criterion',
      t('lessonPlans.ui.levels.beginning', { defaultValue: 'Beginning' }),
      t('lessonPlans.ui.levels.developing', { defaultValue: 'Developing' }),
      t('lessonPlans.ui.levels.proficient', { defaultValue: 'Proficient' }),
      t('lessonPlans.ui.levels.advanced', { defaultValue: 'Advanced' }),
    ];
    const rubricRows = plan.rubric.map((r) => [
      r.criterion,
      r.levels.beginning,
      r.levels.developing,
      r.levels.proficient,
      r.levels.advanced,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [rubricHeaders],
      body: rubricRows,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2, lineColor: COLORS.border, lineWidth: 0.1, textColor: COLORS.text },
      headStyles: { fillColor: '#ffffff', textColor: COLORS.text, fontStyle: 'bold', lineWidth: 0.5, lineColor: COLORS.border },
      margin: { left: SPACING.pageMargin, right: SPACING.pageMargin },
    });

    // @ts-ignore - autoTable adds finalY
    yPos = doc.lastAutoTable.finalY + SPACING.sectionGap;

    // Differentiation
    yPos = checkPageBreak(doc, yPos, 30);
    yPos = addSectionHeading(doc, t('lessonPlans.ui.differentiation', { defaultValue: 'Differentiation' }), yPos);
    for (const diff of plan.differentiation) {
      yPos = checkPageBreak(doc, yPos, 20);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${diff.level}:`, SPACING.pageMargin, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      yPos = addBulletList(doc, diff.strategies, yPos);
    }

    addFooter(doc);

    const filename = `${slugify(title)}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to export PDF. Try using browser print (Ctrl+P) as a fallback.');
  }
}

/**
 * Export student handout as a standalone PDF
 */
export function exportStudentHandoutPDF(plan: CurriculumLessonPlan, t: TFunction): void {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const title = plan.handout.title || t(`lessonPlans.plans.${plan.slug}.title`, { defaultValue: plan.title });

    doc.setProperties({
      title: `Student Handout - ${title}`,
      author: 'ModelMentor',
      creator: 'ModelMentor',
    });

    let yPos = addPageHeader(doc, `Student Handout: ${title}`, t(`lessonPlans.ui.gradeBands.${plan.gradeBand}`, { defaultValue: plan.gradeBand }));

    // Instructions
    yPos = addParagraph(doc, plan.handout.instructions, yPos);

    // Workflow Steps
    if (plan.handout.workflowSteps.length > 0) {
      yPos = checkPageBreak(doc, yPos, 20);
      yPos = addSectionHeading(doc, 'Workflow Steps', yPos);
      const numberedSteps = plan.handout.workflowSteps.map((step, i) => `${i + 1}. ${step}`);
      yPos = addBulletList(doc, numberedSteps, yPos);
    }

    // Sections
    for (const section of plan.handout.sections) {
      yPos = checkPageBreak(doc, yPos, 30);
      yPos = addSectionHeading(doc, section.heading, yPos);

      // Prompts
      yPos = addBulletList(doc, section.prompts, yPos);

      // Reflection Questions
      if (section.reflectionQuestions && section.reflectionQuestions.length > 0) {
        yPos = checkPageBreak(doc, yPos, 15);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(COLORS.textLight);
        doc.text('Reflection Questions:', SPACING.pageMargin, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        yPos = addBulletList(doc, section.reflectionQuestions, yPos);
      }

      // Response space
      if (section.hasResponseSpace) {
        yPos = checkPageBreak(doc, yPos, 25);
        doc.setDrawColor(COLORS.border);
        doc.setLineWidth(0.3);
        doc.setLineDashPattern([2, 2], 0);
        doc.rect(SPACING.pageMargin, yPos, 210 - 2 * SPACING.pageMargin, 20);
        doc.setLineDashPattern([], 0);
        doc.setFontSize(8);
        doc.setTextColor(COLORS.textLight);
        doc.text('(Write your response here)', SPACING.pageMargin + 3, yPos + 5);
        yPos += 25;
      }
    }

    addFooter(doc);

    const filename = `${slugify(title)}-handout-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to export handout PDF. Try using browser print (Ctrl+P) as a fallback.');
  }
}
