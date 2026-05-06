import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { filterHistoryService, type FilterHistory } from '@/services/filterHistoryService';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExportFilterHistoryDialogProps {
  organizationId: string;
  adminId: string;
  isOrgAdmin: boolean;
}

export function ExportFilterHistoryDialog({
  organizationId,
  adminId,
  isOrgAdmin,
}: ExportFilterHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exportScope, setExportScope] = useState<'personal' | 'organization'>('personal');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [exporting, setExporting] = useState(false);

  const getFilterSummary = (filterUrl: string): string => {
    const params = new URLSearchParams(filterUrl);
    const parts: string[] = [];

    const roles = params.get('roles');
    if (roles) {
      parts.push(roles.split(',').map(r => r.charAt(0).toUpperCase() + r.slice(1)).join(', '));
    }

    const status = params.get('status');
    if (status && status !== 'all') {
      parts.push(status.charAt(0).toUpperCase() + status.slice(1));
    }

    const from = params.get('from');
    const to = params.get('to');
    if (from && to) {
      parts.push(`${from} to ${to}`);
    } else if (from) {
      parts.push(`From ${from}`);
    } else if (to) {
      parts.push(`Until ${to}`);
    }

    const search = params.get('search');
    if (search) {
      parts.push(`Search: ${search}`);
    }

    return parts.join(', ') || 'All Requests';
  };

  const parseFilterUrl = (filterUrl: string) => {
    const params = new URLSearchParams(filterUrl);
    return {
      roles: params.get('roles') || '',
      status: params.get('status') || '',
      dateFrom: params.get('from') || '',
      dateTo: params.get('to') || '',
      search: params.get('search') || ''
    };
  };

  const exportToCSV = async () => {
    const targetAdminId = exportScope === 'personal' ? adminId : null;
    const history = await filterHistoryService.getByDateRange(
      organizationId,
      targetAdminId,
      dateRange.from,
      dateRange.to
    );

    const stats = await filterHistoryService.getStatistics(
      organizationId,
      targetAdminId,
      dateRange.from,
      dateRange.to
    );

    // Create CSV header
    const headers = [
      'Timestamp',
      'Filter Summary',
      'Roles',
      'Status',
      'Date Range',
      'Search Query',
      'Access Count'
    ];

    // Count access frequency
    const accessCounts: Record<string, number> = {};
    history.forEach(h => {
      accessCounts[h.filter_url] = (accessCounts[h.filter_url] || 0) + 1;
    });

    // Create CSV rows
    const rows = history.map(item => {
      const parsed = parseFilterUrl(item.filter_url);
      const dateRange = parsed.dateFrom && parsed.dateTo
        ? `${parsed.dateFrom} to ${parsed.dateTo}`
        : parsed.dateFrom
        ? `From ${parsed.dateFrom}`
        : parsed.dateTo
        ? `Until ${parsed.dateTo}`
        : '';

      return [
        new Date(item.accessed_at).toLocaleString(),
        getFilterSummary(item.filter_url),
        parsed.roles,
        parsed.status,
        dateRange,
        parsed.search,
        accessCounts[item.filter_url].toString()
      ];
    });

    // Add statistics rows
    rows.push([]);
    rows.push(['Statistics', '', '', '', '', '', '']);
    rows.push(['Total Filters', stats.totalFilters.toString(), '', '', '', '', '']);
    rows.push(['Unique Filters', stats.uniqueFilters.toString(), '', '', '', '', '']);
    if (stats.mostCommonFilter) {
      rows.push([
        'Most Common Filter',
        getFilterSummary(stats.mostCommonFilter.filter_url),
        '',
        '',
        '',
        '',
        stats.mostCommonFilter.count.toString()
      ]);
    }
    rows.push(['Average Filters Per Day', stats.averageFiltersPerDay.toString(), '', '', '', '', '']);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filter-history-${exportScope}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToJSON = async () => {
    const targetAdminId = exportScope === 'personal' ? adminId : null;
    const history = await filterHistoryService.getByDateRange(
      organizationId,
      targetAdminId,
      dateRange.from,
      dateRange.to
    );

    const stats = await filterHistoryService.getStatistics(
      organizationId,
      targetAdminId,
      dateRange.from,
      dateRange.to
    );

    const exportData = {
      exportDate: new Date().toISOString(),
      exportScope,
      dateRange: {
        from: dateRange.from?.toISOString(),
        to: dateRange.to?.toISOString()
      },
      statistics: stats,
      history: history.map(item => ({
        ...item,
        filterSummary: getFilterSummary(item.filter_url),
        parsedFilters: parseFilterUrl(item.filter_url)
      }))
    };

    // Download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filter-history-${exportScope}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      if (exportFormat === 'csv') {
        await exportToCSV();
      } else {
        await exportToJSON();
      }
      toast.success('Filter history exported successfully');
      setOpen(false);
    } catch (error) {
      console.error('Error exporting filter history:', error);
      toast.error('Failed to export filter history');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Filter History</DialogTitle>
          <DialogDescription>
            Download your filter history for offline analysis
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(v) => setExportFormat(v as 'csv' | 'json')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="font-normal cursor-pointer">
                  CSV (Spreadsheet)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="font-normal cursor-pointer">
                  JSON (Complete data with metadata)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export Scope */}
          {isOrgAdmin && (
            <div className="space-y-2">
              <Label>Export Scope</Label>
              <RadioGroup value={exportScope} onValueChange={(v) => setExportScope(v as 'personal' | 'organization')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal" />
                  <Label htmlFor="personal" className="font-normal cursor-pointer">
                    My History Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="organization" id="organization" />
                  <Label htmlFor="organization" className="font-normal cursor-pointer">
                    All Admins (Organization-wide)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>All time</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Export Button */}
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
