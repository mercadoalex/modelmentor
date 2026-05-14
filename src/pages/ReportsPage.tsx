import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileDown, Calendar, Mail, Trash2, Plus, FileText, BarChart3, AlertTriangle, Users, Download, Send, Loader2 } from 'lucide-react';
import { reportService } from '@/services/reportService';
import { toast } from 'sonner';
import { exportGenericReportPDF } from '@/utils/pdfExport';
import { supabase } from '@/lib/supabase';
import type { ReportType, ReportFormat, ReportFrequency, ScheduledReport } from '@/types/types';

export default function ReportsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  // ── Global loading / list state ───────────────────────────────────────────
  const [loading,          setLoading]          = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [sendingReportId,  setSendingReportId]  = useState<string | null>(null); // tracks which report is being sent

  // ── Delete confirmation dialog state ────────────────────────────────────────
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // ── Report generation form ────────────────────────────────────────────────
  const [reportType,    setReportType]    = useState<ReportType>('class_summary');
  const [format,        setFormat]        = useState<ReportFormat>('pdf');
  const [startDate,     setStartDate]     = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate,       setEndDate]       = useState(new Date().toISOString().split('T')[0]);
  const [includeCharts, setIncludeCharts] = useState(true);

  // ── Schedule dialog form ──────────────────────────────────────────────────
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleName,       setScheduleName]       = useState('');
  const [scheduleFrequency,  setScheduleFrequency]  = useState<ReportFrequency>('weekly');
  const [deliveryDay,        setDeliveryDay]        = useState(1);
  const [recipients,         setRecipients]         = useState('');

  // ── Auth guard + initial load ─────────────────────────────────────────────
  useEffect(() => {
    if (user && user.user_metadata?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
    if (user) loadScheduledReports();
  }, [user, navigate]);

  // ── Fetch all scheduled reports for this user ─────────────────────────────
  const loadScheduledReports = async () => {
    if (!user) return;
    const reports = await reportService.getScheduledReports(user.id);
    setScheduledReports(reports);
  };

  // ── Generate & download a one-off report (PDF or CSV) ────────────────────
  const handleGenerateReport = async () => {
    if (!user) return;

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date must be before end date');
      return;
    }

    setLoading(true);
    try {
      const reportData = await reportService.generateReportData(
        reportType,
        { start: startDate, end: endDate }
      );

      if (format === 'csv') {
        reportService.downloadCSV(reportData);
        toast.success('CSV report downloaded successfully');
      } else {
        // Map service data into the PDF exporter's expected shape
        const pdfData = {
          summary: {
            total_students:   reportData.totalStudents,
            average_progress: reportData.averageScore,
            at_risk_count:    reportData.atRiskCount,
          },
          students: reportData.students.map(sp => ({
            id:               sp.student.id,
            name:             sp.student.username || sp.student.email || 'Unknown',
            email:            sp.student.email || '',
            projects_count:   sp.totalProjects,
            average_progress: sp.averageScore,
            badges_count:     sp.badges.length,
            status:           sp.alerts.length > 0 ? 'At Risk' : 'Active',
          })),
          concepts: reportData.conceptAverages.map(ca => ({
            name:          ca.concept,
            mastery_level: ca.average,
            student_count: reportData.totalStudents,
          })),
        };

        exportGenericReportPDF(reportType, pdfData, { author: user.email || 'Admin' });
        toast.success('PDF report downloaded successfully');
      }
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Create a new scheduled report record in Supabase ─────────────────────
  const handleCreateSchedule = async () => {
    if (!user) return;

    if (!scheduleName.trim()) { toast.error('Please enter a report name');              return; }
    if (!recipients.trim())   { toast.error('Please enter at least one recipient email'); return; }

    setLoading(true);
    try {
      const recipientList = recipients
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

      await reportService.createScheduledReport({
        user_id:        user.id,
        report_name:    scheduleName,
        report_type:    reportType,
        frequency:      scheduleFrequency,
        delivery_day:   deliveryDay,
        recipients:     recipientList,
        filters:        { date_range: { start: startDate, end: endDate } },
        format,
        include_charts: includeCharts,
        is_active:      true,
        delivery_status: 'pending',
        last_error:     null,
        delivery_count: 0,
      });

      toast.success('Scheduled report created successfully');
      setShowScheduleDialog(false);
      setScheduleName('');
      setRecipients('');
      loadScheduledReports();
    } catch (error) {
      toast.error('Failed to create scheduled report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Manually trigger the Edge Function for a single report ────────────────
  const handleSendNow = async (report: ScheduledReport) => {
    setSendingReportId(report.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-scheduled-report', {
        body: { reportId: report.id, force: true }, // force=true bypasses the schedule check
      });

      if (error) throw error;

      // Edge Function returns per-report results — check if ours succeeded
      const result = data?.results?.find((r: { reportId: string }) => r.reportId === report.id);
      if (result?.status === 'error') throw new Error(result.error);

      toast.success(`Report "${report.report_name}" sent successfully`);
      loadScheduledReports(); // refresh delivery_status / last_sent_at
    } catch (error) {
      toast.error(`Failed to send report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(error);
    } finally {
      setSendingReportId(null);
    }
  };

  // ── Delete a scheduled report ─────────────────────────────────────────────
  const handleDeleteSchedule = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!itemToDelete) return;
    try {
      await reportService.deleteScheduledReport(itemToDelete);
      toast.success('Scheduled report deleted');
      loadScheduledReports();
    } catch (error) {
      toast.error('Failed to delete scheduled report');
      console.error(error);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // ── Toggle active/disabled state ──────────────────────────────────────────
  const handleToggleActive = async (report: ScheduledReport) => {
    try {
      await reportService.updateScheduledReport(report.id, { is_active: !report.is_active });
      toast.success(report.is_active ? 'Report disabled' : 'Report enabled');
      loadScheduledReports();
    } catch (error) {
      toast.error('Failed to update report status');
      console.error(error);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getReportTypeIcon = (type: ReportType) => {
    switch (type) {
      case 'student_progress': return <Users        className="h-4 w-4" />;
      case 'concept_mastery':  return <BarChart3    className="h-4 w-4" />;
      case 'at_risk':          return <AlertTriangle className="h-4 w-4" />;
      case 'class_summary':    return <FileText     className="h-4 w-4" />;
    }
  };

  const getFrequencyLabel = (frequency: ReportFrequency, day: number | null) => {
    if (frequency === 'weekly') {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `Weekly on ${days[day || 0]}`;
    }
    return `Monthly on day ${day || 1}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 max-w-6xl">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports and schedule automated delivery
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList>
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          </TabsList>

          {/* ── Generate Report Tab ────────────────────────────────────────── */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report Configuration</CardTitle>
                <CardDescription>Customize your report parameters and export format</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Report type selector */}
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class_summary">Class Summary Report</SelectItem>
                      <SelectItem value="student_progress">Student Progress Report</SelectItem>
                      <SelectItem value="concept_mastery">Concept Mastery Report</SelectItem>
                      <SelectItem value="at_risk">At-Risk Students Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                {/* Format selector */}
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as ReportFormat)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                      <SelectItem value="pdf">PDF (Document)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions: download now or open schedule dialog */}
                <div className="flex gap-3 pt-4">
                  <Button onClick={handleGenerateReport} disabled={loading} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? 'Generating...' : 'Download Report'}
                  </Button>

                  <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule Automated Report</DialogTitle>
                        <DialogDescription>
                          Configure automated report delivery via email
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">

                        {/* Report name */}
                        <div className="space-y-2">
                          <Label>Report Name</Label>
                          <Input
                            placeholder="e.g., Weekly Class Summary"
                            value={scheduleName}
                            onChange={(e) => setScheduleName(e.target.value)}
                          />
                        </div>

                        {/* Frequency */}
                        <div className="space-y-2">
                          <Label>Frequency</Label>
                          <Select value={scheduleFrequency} onValueChange={(v) => setScheduleFrequency(v as ReportFrequency)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Delivery day — changes options based on frequency */}
                        <div className="space-y-2">
                          <Label>{scheduleFrequency === 'weekly' ? 'Day of Week' : 'Day of Month'}</Label>
                          <Select
                            value={deliveryDay.toString()}
                            onValueChange={(v) => setDeliveryDay(parseInt(v))}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {scheduleFrequency === 'weekly' ? (
                                <>
                                  <SelectItem value="0">Sunday</SelectItem>
                                  <SelectItem value="1">Monday</SelectItem>
                                  <SelectItem value="2">Tuesday</SelectItem>
                                  <SelectItem value="3">Wednesday</SelectItem>
                                  <SelectItem value="4">Thursday</SelectItem>
                                  <SelectItem value="5">Friday</SelectItem>
                                  <SelectItem value="6">Saturday</SelectItem>
                                </>
                              ) : (
                                Array.from({ length: 28 }, (_, i) => (
                                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                                    {i + 1}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Recipient emails */}
                        <div className="space-y-2">
                          <Label>Recipients (comma-separated emails)</Label>
                          <Input
                            placeholder="teacher@school.edu, admin@school.edu"
                            value={recipients}
                            onChange={(e) => setRecipients(e.target.value)}
                          />
                        </div>

                        <Button onClick={handleCreateSchedule} disabled={loading} className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Schedule
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Info alert */}
            <Alert>
              <FileDown className="h-4 w-4" />
              <AlertDescription>
                Reports include student progress data, concept mastery metrics, and performance analytics
                based on the selected date range. Scheduled reports are automatically generated and
                delivered via email at the configured frequency.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* ── Scheduled Reports Tab ──────────────────────────────────────── */}
          <TabsContent value="scheduled" className="space-y-6">
            {scheduledReports.length === 0 ? (
              /* Empty state */
              <Card>
                <CardContent className="py-12 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
                  <p className="text-muted-foreground mb-4">
                    Create automated reports to receive regular updates via email
                  </p>
                  <Button onClick={() => setShowScheduleDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Scheduled Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {scheduledReports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        {/* Report title + frequency */}
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getReportTypeIcon(report.report_type)}</div>
                          <div>
                            <CardTitle className="text-lg">{report.report_name}</CardTitle>
                            <CardDescription className="mt-1">
                              {getFrequencyLabel(report.frequency, report.delivery_day)}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex gap-2">
                          <Badge variant={report.is_active ? 'default' : 'secondary'}>
                            {report.is_active ? 'Active' : 'Disabled'}
                          </Badge>
                          {report.delivery_status === 'success' && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Delivered
                            </Badge>
                          )}
                          {report.delivery_status === 'error' && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Error
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        {/* Recipients */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{report.recipients.join(', ')}</span>
                        </div>

                        {/* Format */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{report.format.toUpperCase()} format</span>
                        </div>

                        {/* Last delivery info */}
                        {report.last_sent_at && (
                          <div className="text-sm text-muted-foreground">
                            Last sent: {new Date(report.last_sent_at).toLocaleString()}
                            {report.delivery_count > 0 && ` (${report.delivery_count} total deliveries)`}
                          </div>
                        )}

                        {/* Last error — shown only when delivery failed */}
                        {report.last_error && (
                          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            <strong>Last Error:</strong> {report.last_error}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-2">
                          {/* Toggle active/disabled */}
                          <Button size="sm" variant="outline" onClick={() => handleToggleActive(report)}>
                            {report.is_active ? 'Disable' : 'Enable'}
                          </Button>

                          {/* Manual send — invokes Edge Function immediately with force flag */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendNow(report)}
                            disabled={sendingReportId === report.id}
                          >
                            {sendingReportId === report.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 mr-1" />
                            )}
                            Send Now
                          </Button>

                          {/* Delete */}
                          <Button size="sm" variant="outline" onClick={() => handleDeleteSchedule(report.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled report? This will stop all future deliveries and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSchedule}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}