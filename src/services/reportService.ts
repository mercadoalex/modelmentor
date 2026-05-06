import { supabase } from '@/db/supabase';
import { dashboardService } from './dashboardService';
import type { ReportData, ReportType, ScheduledReport, ConceptName } from '@/types/types';

export const reportService = {
  // Generate report data based on filters
  async generateReportData(
    reportType: ReportType,
    dateRange: { start: string; end: string },
    studentIds?: string[],
    conceptNames?: ConceptName[]
  ): Promise<ReportData> {
    try {
      // Get all students or filtered students
      const allProgress = await dashboardService.getAllStudentsProgress();
      let filteredStudents = allProgress;

      // Filter by student IDs if provided
      if (studentIds && studentIds.length > 0) {
        filteredStudents = allProgress.filter(p => studentIds.includes(p.student.id));
      }

      // Filter by date range (filter activities within date range)
      filteredStudents = filteredStudents.map(student => ({
        ...student,
        recentActivity: student.recentActivity.filter(activity => {
          const activityDate = new Date(activity.created_at);
          return activityDate >= new Date(dateRange.start) && activityDate <= new Date(dateRange.end);
        }),
        conceptMastery: conceptNames && conceptNames.length > 0
          ? student.conceptMastery.filter(m => conceptNames.includes(m.concept_name))
          : student.conceptMastery
      }));

      // Calculate statistics
      const totalStudents = filteredStudents.length;
      const averageScore = totalStudents > 0
        ? Math.round(filteredStudents.reduce((sum, p) => sum + p.averageScore, 0) / totalStudents)
        : 0;
      const atRiskCount = filteredStudents.filter(p => p.alerts.length > 0).length;

      // Calculate concept averages
      const conceptScores: Record<string, number[]> = {};
      filteredStudents.forEach(progress => {
        progress.conceptMastery.forEach(mastery => {
          if (!conceptScores[mastery.concept_name]) {
            conceptScores[mastery.concept_name] = [];
          }
          conceptScores[mastery.concept_name].push(mastery.mastery_score);
        });
      });

      const conceptAverages = Object.entries(conceptScores).map(([concept, scores]) => ({
        concept,
        average: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
        struggling: scores.filter(s => s < 70).length
      }));

      return {
        title: this.getReportTitle(reportType),
        dateRange,
        generatedAt: new Date().toISOString(),
        students: filteredStudents,
        conceptAverages,
        totalStudents,
        averageScore,
        atRiskCount
      };
    } catch (error) {
      console.error('Error generating report data:', error);
      throw error;
    }
  },

  // Get report title based on type
  getReportTitle(reportType: ReportType): string {
    const titles: Record<ReportType, string> = {
      student_progress: 'Student Progress Report',
      concept_mastery: 'Concept Mastery Report',
      at_risk: 'At-Risk Students Report',
      class_summary: 'Class Summary Report'
    };
    return titles[reportType];
  },

  // Export to CSV
  exportToCSV(reportData: ReportData): string {
    const rows: string[][] = [];

    // Header
    rows.push([reportData.title]);
    rows.push([`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`]);
    rows.push([`Date Range: ${new Date(reportData.dateRange.start).toLocaleDateString()} - ${new Date(reportData.dateRange.end).toLocaleDateString()}`]);
    rows.push([]);

    // Summary statistics
    rows.push(['Summary Statistics']);
    rows.push(['Total Students', reportData.totalStudents.toString()]);
    rows.push(['Average Score', `${reportData.averageScore}%`]);
    rows.push(['At-Risk Students', reportData.atRiskCount.toString()]);
    rows.push([]);

    // Concept averages
    rows.push(['Concept Mastery Averages']);
    rows.push(['Concept', 'Average Score', 'Struggling Students']);
    reportData.conceptAverages.forEach(ca => {
      rows.push([
        ca.concept.replace(/_/g, ' '),
        `${ca.average}%`,
        ca.struggling.toString()
      ]);
    });
    rows.push([]);

    // Student details
    rows.push(['Student Details']);
    rows.push(['Name', 'Email', 'Total Projects', 'Completed Projects', 'Average Score', 'At-Risk']);
    reportData.students.forEach(student => {
      rows.push([
        student.student.username || 'N/A',
        student.student.email || 'N/A',
        student.totalProjects.toString(),
        student.completedProjects.toString(),
        `${student.averageScore}%`,
        student.alerts.length > 0 ? 'Yes' : 'No'
      ]);
    });

    // Convert to CSV string
    return rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
          ? `"${escaped}"`
          : escaped;
      }).join(',')
    ).join('\n');
  },

  // Download CSV file
  downloadCSV(reportData: ReportData, filename?: string) {
    const csv = this.exportToCSV(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `${reportData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Scheduled Reports Management
  async createScheduledReport(report: Omit<ScheduledReport, 'id' | 'created_at' | 'updated_at' | 'last_sent_at'>): Promise<ScheduledReport> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      throw error;
    }
  },

  async getScheduledReports(userId: string): Promise<ScheduledReport[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
      return [];
    }
  },

  async updateScheduledReport(id: string, updates: Partial<ScheduledReport>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      return false;
    }
  },

  async deleteScheduledReport(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      return false;
    }
  }
};
