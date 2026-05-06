import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

// PDF-specific data interfaces
interface PDFReportData {
  summary?: {
    total_students?: number;
    active_projects?: number;
    completed_projects?: number;
    average_progress?: number;
    total_badges?: number;
    total_projects?: number;
    in_progress_projects?: number;
    total_time_hours?: number;
    at_risk_count?: number;
    critical_count?: number;
    attention_count?: number;
  };
  students?: Array<{
    id: string;
    name: string;
    email?: string;
    projects_count?: number;
    average_progress?: number;
    badges_count?: number;
    status?: string;
    last_active?: string;
    risk_level?: string;
    risk_reason?: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    model_type?: string;
    progress?: number;
    status?: string;
    updated_at: string;
  }>;
  badges?: Array<{
    id: string;
    name: string;
    description: string;
    earned_at: string;
  }>;
  concepts?: Array<{
    name: string;
    mastery_level: number;
    student_count?: number;
    last_practiced?: string;
  }>;
}

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  author?: string;
  includeDate?: boolean;
  includePageNumbers?: boolean;
}

interface TableData {
  headers: string[];
  rows: (string | number)[][];
}

interface ChartData {
  title: string;
  labels: string[];
  values: number[];
}

// Brand colors (minimal aesthetic)
const COLORS = {
  primary: '#2563eb',
  text: '#1f2937',
  textLight: '#6b7280',
  border: '#e5e7eb',
  background: '#ffffff',
};

// Typography (minimal aesthetic - clear hierarchy)
const FONTS = {
  title: { size: 24, weight: 'bold' as const },
  heading: { size: 16, weight: 'bold' as const },
  subheading: { size: 12, weight: 'bold' as const },
  body: { size: 10, weight: 'normal' as const },
  small: { size: 8, weight: 'normal' as const },
};

// Spacing (ample whitespace)
const SPACING = {
  pageMargin: 20,
  sectionGap: 12,
  paragraphGap: 8,
  lineHeight: 1.5,
};

/**
 * Initialize PDF document with branding and metadata
 */
function initializePDF(options: PDFExportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set document metadata
  doc.setProperties({
    title: options.title,
    author: options.author || 'ModelMentor',
    creator: 'ModelMentor',
    subject: options.subtitle || '',
  });

  return doc;
}

/**
 * Add header with logo and title
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string): number {
  let yPos = SPACING.pageMargin;

  // Add logo text (since we can't easily embed images in jsPDF without base64)
  doc.setFontSize(FONTS.title.size);
  doc.setFont('helvetica', FONTS.title.weight);
  doc.setTextColor(COLORS.primary);
  doc.text('ModelMentor', SPACING.pageMargin, yPos);
  yPos += 10;

  // Add title
  doc.setFontSize(FONTS.heading.size);
  doc.setFont('helvetica', FONTS.heading.weight);
  doc.setTextColor(COLORS.text);
  doc.text(title, SPACING.pageMargin, yPos);
  yPos += 8;

  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(FONTS.body.size);
    doc.setFont('helvetica', FONTS.body.weight);
    doc.setTextColor(COLORS.textLight);
    doc.text(subtitle, SPACING.pageMargin, yPos);
    yPos += 6;
  }

  // Add date
  doc.setFontSize(FONTS.small.size);
  doc.setTextColor(COLORS.textLight);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, SPACING.pageMargin, yPos);
  yPos += SPACING.sectionGap;

  // Add separator line
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(SPACING.pageMargin, yPos, 210 - SPACING.pageMargin, yPos);
  yPos += SPACING.sectionGap;

  return yPos;
}

/**
 * Add section heading
 */
function addSectionHeading(doc: jsPDF, heading: string, yPos: number): number {
  doc.setFontSize(FONTS.subheading.size);
  doc.setFont('helvetica', FONTS.subheading.weight);
  doc.setTextColor(COLORS.text);
  doc.text(heading, SPACING.pageMargin, yPos);
  return yPos + SPACING.paragraphGap;
}

/**
 * Add paragraph text with word wrapping
 */
function addParagraph(doc: jsPDF, text: string, yPos: number, maxWidth?: number): number {
  doc.setFontSize(FONTS.body.size);
  doc.setFont('helvetica', FONTS.body.weight);
  doc.setTextColor(COLORS.text);
  
  const width = maxWidth || (210 - 2 * SPACING.pageMargin);
  const lines = doc.splitTextToSize(text, width);
  
  doc.text(lines, SPACING.pageMargin, yPos);
  return yPos + (lines.length * FONTS.body.size * SPACING.lineHeight / 2.5) + SPACING.paragraphGap;
}

/**
 * Add table with data
 */
function addTable(doc: jsPDF, tableData: TableData, yPos: number): number {
  autoTable(doc, {
    startY: yPos,
    head: [tableData.headers],
    body: tableData.rows,
    theme: 'plain',
    styles: {
      fontSize: FONTS.body.size,
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.1,
      textColor: COLORS.text,
    },
    headStyles: {
      fillColor: COLORS.background,
      textColor: COLORS.text,
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: COLORS.border,
    },
    alternateRowStyles: {
      fillColor: '#f9fafb',
    },
    margin: { left: SPACING.pageMargin, right: SPACING.pageMargin },
  });

  // @ts-ignore - autoTable adds finalY property
  return doc.lastAutoTable.finalY + SPACING.sectionGap;
}

/**
 * Add key-value pairs (metadata)
 */
function addKeyValuePairs(doc: jsPDF, pairs: Record<string, string | number>, yPos: number): number {
  doc.setFontSize(FONTS.body.size);
  
  Object.entries(pairs).forEach(([key, value]) => {
    // Key (bold)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text(`${key}:`, SPACING.pageMargin, yPos);
    
    // Value (normal)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    doc.text(String(value), SPACING.pageMargin + 40, yPos);
    
    yPos += 6;
  });
  
  return yPos + SPACING.paragraphGap;
}

/**
 * Add page footer with page numbers
 */
function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(FONTS.small.size);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    
    // Page number
    const pageText = `Page ${i} of ${pageCount}`;
    const textWidth = doc.getTextWidth(pageText);
    doc.text(pageText, (210 - textWidth) / 2, 297 - 10);
    
    // Footer text
    doc.text('ModelMentor - ML Training Platform', SPACING.pageMargin, 297 - 10);
  }
}

/**
 * Check if new page is needed
 */
function checkPageBreak(doc: jsPDF, currentY: number, requiredSpace: number = 30): number {
  if (currentY + requiredSpace > 297 - SPACING.pageMargin) {
    doc.addPage();
    return SPACING.pageMargin;
  }
  return currentY;
}

/**
 * Export class summary report as PDF
 */
export function exportClassSummaryPDF(reportData: PDFReportData, options: Partial<PDFExportOptions> = {}) {
  const doc = initializePDF({
    title: 'Class Summary Report',
    subtitle: 'Overview of class performance and progress',
    ...options,
  });

  let yPos = addHeader(doc, 'Class Summary Report', 'Overview of class performance and progress');

  // Summary metrics
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Summary Metrics', yPos);
  
  if (reportData.summary) {
    yPos = addKeyValuePairs(doc, {
      'Total Students': reportData.summary.total_students || 0,
      'Active Projects': reportData.summary.active_projects || 0,
      'Completed Projects': reportData.summary.completed_projects || 0,
      'Average Progress': `${reportData.summary.average_progress || 0}%`,
      'Total Badges Earned': reportData.summary.total_badges || 0,
    }, yPos);
  }

  // Student performance table
  if (reportData.students && reportData.students.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Student Performance', yPos);
    
    const tableData: TableData = {
      headers: ['Student Name', 'Projects', 'Progress', 'Badges', 'Status'],
      rows: reportData.students.map(student => [
        student.name || 'Unknown',
        String(student.projects_count || 0),
        `${student.average_progress || 0}%`,
        String(student.badges_count || 0),
        student.status || 'Active',
      ]),
    };
    
    yPos = addTable(doc, tableData, yPos);
  }

  // Concept mastery
  if (reportData.concepts && reportData.concepts.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Concept Mastery', yPos);
    
    const tableData: TableData = {
      headers: ['Concept', 'Mastery Level', 'Students'],
      rows: reportData.concepts.map(concept => [
        concept.name || 'Unknown',
        `${concept.mastery_level || 0}%`,
        String(concept.student_count || 0),
      ]),
    };
    
    yPos = addTable(doc, tableData, yPos);
  }

  addFooter(doc);
  doc.save(`class-summary-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export student progress report as PDF
 */
export function exportStudentProgressPDF(
  studentName: string,
  reportData: PDFReportData,
  options: Partial<PDFExportOptions> = {}
) {
  const doc = initializePDF({
    title: `Student Progress Report - ${studentName}`,
    subtitle: 'Individual student performance and achievements',
    ...options,
  });

  let yPos = addHeader(
    doc,
    `Student Progress Report`,
    `${studentName} - Individual performance and achievements`
  );

  // Student overview
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Overview', yPos);
  
  if (reportData.summary) {
    yPos = addKeyValuePairs(doc, {
      'Total Projects': reportData.summary.total_projects || 0,
      'Completed Projects': reportData.summary.completed_projects || 0,
      'In Progress': reportData.summary.in_progress_projects || 0,
      'Overall Progress': `${reportData.summary.average_progress || 0}%`,
      'Badges Earned': reportData.summary.total_badges || 0,
      'Time Spent': `${reportData.summary.total_time_hours || 0} hours`,
    }, yPos);
  }

  // Projects table
  if (reportData.projects && reportData.projects.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Projects', yPos);
    
    const tableData: TableData = {
      headers: ['Project', 'Type', 'Progress', 'Status', 'Last Updated'],
      rows: reportData.projects.map(project => [
        project.title || 'Untitled',
        project.model_type || 'N/A',
        `${project.progress || 0}%`,
        project.status || 'Active',
        new Date(project.updated_at || '').toLocaleDateString(),
      ]),
    };
    
    yPos = addTable(doc, tableData, yPos);
  }

  // Badges
  if (reportData.badges && reportData.badges.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Badges Earned', yPos);
    
    const tableData: TableData = {
      headers: ['Badge', 'Description', 'Earned Date'],
      rows: reportData.badges.map(badge => [
        badge.name || 'Unknown',
        badge.description || '',
        new Date(badge.earned_at || '').toLocaleDateString(),
      ]),
    };
    
    yPos = addTable(doc, tableData, yPos);
  }

  // Concept mastery
  if (reportData.concepts && reportData.concepts.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Concept Mastery', yPos);
    
    const tableData: TableData = {
      headers: ['Concept', 'Mastery Level', 'Last Practiced'],
      rows: reportData.concepts.map(concept => [
        concept.name || 'Unknown',
        `${concept.mastery_level || 0}%`,
        concept.last_practiced ? new Date(concept.last_practiced).toLocaleDateString() : 'Never',
      ]),
    };
    
    yPos = addTable(doc, tableData, yPos);
  }

  addFooter(doc);
  doc.save(`student-progress-${studentName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export training results as PDF
 */
export function exportTrainingResultsPDF(
  projectTitle: string,
  modelType: string,
  metrics: Record<string, number>,
  trainingHistory?: { epoch: number; loss: number; accuracy?: number }[],
  options: Partial<PDFExportOptions> = {}
) {
  const doc = initializePDF({
    title: `Training Results - ${projectTitle}`,
    subtitle: 'Model training metrics and performance',
    ...options,
  });

  let yPos = addHeader(
    doc,
    'Training Results',
    `${projectTitle} - ${modelType}`
  );

  // Model information
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Model Information', yPos);
  yPos = addKeyValuePairs(doc, {
    'Project': projectTitle,
    'Model Type': modelType,
    'Training Date': new Date().toLocaleDateString(),
  }, yPos);

  // Performance metrics
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Performance Metrics', yPos);
  
  const metricsFormatted: Record<string, string> = {};
  Object.entries(metrics).forEach(([key, value]) => {
    const label = key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    metricsFormatted[label] = typeof value === 'number' ? value.toFixed(4) : String(value);
  });
  
  yPos = addKeyValuePairs(doc, metricsFormatted, yPos);

  // Training history
  if (trainingHistory && trainingHistory.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Training History', yPos);
    
    const tableData: TableData = {
      headers: ['Epoch', 'Loss', ...(trainingHistory[0].accuracy !== undefined ? ['Accuracy'] : [])],
      rows: trainingHistory.map(entry => [
        String(entry.epoch),
        entry.loss.toFixed(4),
        ...(entry.accuracy !== undefined ? [entry.accuracy.toFixed(4)] : []),
      ]),
    };
    
    yPos = addTable(doc, tableData, yPos);
  }

  // Summary
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Summary', yPos);
  yPos = addParagraph(
    doc,
    `Training completed successfully. The model achieved the metrics shown above. ` +
    `You can now use this model for predictions or export it for deployment.`,
    yPos
  );

  addFooter(doc);
  doc.save(`training-results-${projectTitle.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export at-risk students report as PDF
 */
export function exportAtRiskReportPDF(reportData: PDFReportData, options: Partial<PDFExportOptions> = {}) {
  const doc = initializePDF({
    title: 'At-Risk Students Report',
    subtitle: 'Students requiring attention and intervention',
    ...options,
  });

  let yPos = addHeader(doc, 'At-Risk Students Report', 'Students requiring attention and intervention');

  // Summary
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Summary', yPos);
  
  if (reportData.summary) {
    yPos = addKeyValuePairs(doc, {
      'Total At-Risk Students': reportData.summary.at_risk_count || 0,
      'Critical Cases': reportData.summary.critical_count || 0,
      'Needs Attention': reportData.summary.attention_count || 0,
    }, yPos);
  }

  // At-risk students table
  if (reportData.students && reportData.students.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'At-Risk Students', yPos);
    
    const tableData: TableData = {
      headers: ['Student', 'Risk Level', 'Progress', 'Last Active', 'Reason'],
      rows: reportData.students.map(student => [
        student.name || 'Unknown',
        student.risk_level || 'Unknown',
        `${student.average_progress || 0}%`,
        student.last_active ? new Date(student.last_active).toLocaleDateString() : 'Never',
        student.risk_reason || 'Low engagement',
      ]),
    };
    
    yPos = addTable(doc, tableData, yPos);
  }

  // Recommendations
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Recommendations', yPos);
  yPos = addParagraph(
    doc,
    'Consider the following interventions for at-risk students:\n\n' +
    '• Schedule one-on-one meetings to understand challenges\n' +
    '• Provide additional resources and support materials\n' +
    '• Assign peer mentors or study buddies\n' +
    '• Adjust project difficulty or provide alternative assignments\n' +
    '• Monitor progress more frequently',
    yPos
  );

  addFooter(doc);
  doc.save(`at-risk-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export generic report data as PDF
 */
export function exportGenericReportPDF(
  reportType: string,
  reportData: PDFReportData,
  options: Partial<PDFExportOptions> = {}
) {
  // Route to specific export function based on report type
  switch (reportType) {
    case 'class_summary':
      return exportClassSummaryPDF(reportData, options);
    case 'at_risk':
      return exportAtRiskReportPDF(reportData, options);
    default:
      return exportClassSummaryPDF(reportData, options);
  }
}

/**
 * Export test results as PDF
 */
export function exportTestResultsPDF(
  projectTitle: string,
  modelType: string,
  testResults: {
    predictions: Array<{
      input: string | number[];
      actualLabel?: string;
      predictedLabel: string;
      confidence: number;
      isCorrect?: boolean;
    }>;
    confusionMatrix?: number[][];
    labels?: string[];
    accuracy?: number;
    metrics?: {
      precision: number;
      recall: number;
      f1Score: number;
    };
  },
  options: Partial<PDFExportOptions> = {}
) {
  const doc = initializePDF({
    title: `Test Results - ${projectTitle}`,
    subtitle: 'Model testing and evaluation results',
    ...options,
  });

  let yPos = addHeader(
    doc,
    'Test Results',
    `${projectTitle} - ${modelType}`
  );

  // Model information
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Model Information', yPos);
  yPos = addKeyValuePairs(doc, {
    'Project': projectTitle,
    'Model Type': modelType,
    'Test Date': new Date().toLocaleDateString(),
    'Total Predictions': testResults.predictions.length,
  }, yPos);

  // Overall metrics
  if (testResults.accuracy !== undefined || testResults.metrics) {
    yPos = checkPageBreak(doc, yPos);
    yPos = addSectionHeading(doc, 'Overall Metrics', yPos);
    
    const metricsData: Record<string, string> = {};
    if (testResults.accuracy !== undefined) {
      metricsData['Accuracy'] = `${(testResults.accuracy * 100).toFixed(2)}%`;
    }
    if (testResults.metrics) {
      metricsData['Precision'] = `${(testResults.metrics.precision * 100).toFixed(2)}%`;
      metricsData['Recall'] = `${(testResults.metrics.recall * 100).toFixed(2)}%`;
      metricsData['F1-Score'] = `${(testResults.metrics.f1Score * 100).toFixed(2)}%`;
    }
    
    yPos = addKeyValuePairs(doc, metricsData, yPos);
  }

  // Confusion matrix
  if (testResults.confusionMatrix && testResults.labels) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Confusion Matrix', yPos);
    
    const headers = ['Actual \\ Predicted', ...testResults.labels];
    const rows = testResults.confusionMatrix.map((row, i) => [
      testResults.labels![i],
      ...row.map(val => String(val)),
    ]);
    
    yPos = addTable(doc, { headers, rows }, yPos);
  }

  // Sample predictions (first 20)
  if (testResults.predictions.length > 0) {
    yPos = checkPageBreak(doc, yPos, 50);
    yPos = addSectionHeading(doc, 'Sample Predictions', yPos);
    
    const sampleSize = Math.min(20, testResults.predictions.length);
    const samples = testResults.predictions.slice(0, sampleSize);
    
    const headers = ['#', 'Input', 'Predicted', 'Confidence'];
    if (samples[0].actualLabel) {
      headers.splice(2, 0, 'Actual');
      headers.push('Status');
    }
    
    const rows = samples.map((pred, i) => {
      const inputStr = typeof pred.input === 'string' 
        ? pred.input.substring(0, 50) + (pred.input.length > 50 ? '...' : '')
        : pred.input.join(', ');
      
      const row = [
        String(i + 1),
        inputStr,
        pred.predictedLabel,
        `${(pred.confidence * 100).toFixed(1)}%`,
      ];
      
      if (pred.actualLabel) {
        row.splice(2, 0, pred.actualLabel);
        row.push(pred.isCorrect ? '✓' : '✗');
      }
      
      return row;
    });
    
    yPos = addTable(doc, { headers, rows }, yPos);
    
    if (testResults.predictions.length > sampleSize) {
      yPos = addParagraph(
        doc,
        `Showing ${sampleSize} of ${testResults.predictions.length} predictions.`,
        yPos
      );
    }
  }

  // Summary
  yPos = checkPageBreak(doc, yPos);
  yPos = addSectionHeading(doc, 'Summary', yPos);
  
  const correctCount = testResults.predictions.filter(p => p.isCorrect).length;
  const avgConfidence = testResults.predictions.reduce((sum, p) => sum + p.confidence, 0) / testResults.predictions.length;
  
  yPos = addParagraph(
    doc,
    `Testing completed with ${testResults.predictions.length} predictions. ` +
    `${correctCount > 0 ? `${correctCount} predictions were correct (${((correctCount / testResults.predictions.length) * 100).toFixed(1)}% accuracy). ` : ''}` +
    `Average confidence: ${(avgConfidence * 100).toFixed(1)}%. ` +
    `The model shows ${avgConfidence >= 0.8 ? 'high' : avgConfidence >= 0.5 ? 'moderate' : 'low'} confidence in its predictions.`,
    yPos
  );

  addFooter(doc);
  doc.save(`test-results-${projectTitle.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
}

