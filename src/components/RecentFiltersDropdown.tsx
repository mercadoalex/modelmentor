import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Clock, Trash2, TrendingUp } from 'lucide-react';
import { filterHistoryService, type FilterHistory } from '@/services/filterHistoryService';
import { toast } from 'sonner';
import { ExportFilterHistoryDialog } from './ExportFilterHistoryDialog';

interface RecentFiltersDropdownProps {
  organizationId: string;
  adminId: string;
  currentFilterUrl: string;
  isOrgAdmin: boolean;
}

export function RecentFiltersDropdown({
  organizationId,
  adminId,
  currentFilterUrl,
  isOrgAdmin,
}: RecentFiltersDropdownProps) {
  const navigate = useNavigate();
  const [history, setHistory] = useState<FilterHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [organizationId, adminId]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await filterHistoryService.getRecent(organizationId, adminId, 10);
    setHistory(data);
    setLoading(false);
  };

  const handleSelectHistory = (filterUrl: string) => {
    navigate({ search: filterUrl });
    toast.success('Filter applied from history');
  };

  const handleClearHistory = async () => {
    await filterHistoryService.clearAll(organizationId, adminId);
    setHistory([]);
    toast.success('Filter history cleared');
  };

  const getFilterSummary = (filterUrl: string): string => {
    const params = new URLSearchParams(filterUrl);
    const parts: string[] = [];

    // Roles
    const roles = params.get('roles');
    if (roles) {
      const roleList = roles.split(',');
      if (roleList.length === 1) {
        parts.push(roleList[0] === 'student' ? 'Students' : 'Teachers');
      } else if (roleList.length === 2) {
        parts.push('All Roles');
      }
    }

    // Status
    const status = params.get('status');
    if (status && status !== 'all') {
      parts.push(status.charAt(0).toUpperCase() + status.slice(1));
    }

    // Date range
    const from = params.get('from');
    const to = params.get('to');
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const diffDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        parts.push('Last 7 days');
      } else if (diffDays <= 30) {
        parts.push('Last 30 days');
      } else {
        parts.push('Custom range');
      }
    } else if (from) {
      parts.push('From ' + new Date(from).toLocaleDateString());
    } else if (to) {
      parts.push('Until ' + new Date(to).toLocaleDateString());
    }

    // Search
    const search = params.get('search');
    if (search) {
      parts.push(`"${search}"`);
    }

    return parts.length > 0 ? parts.join(', ') : 'All Requests';
  };

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading}>
            <Clock className="h-4 w-4 mr-2" />
            Recent Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          <DropdownMenuLabel>Recent Filter Combinations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {history.length === 0 ? (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              No recent filters
            </div>
          ) : (
            <>
              {history.map((item) => (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => handleSelectHistory(item.filter_url)}
                  className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                  disabled={item.filter_url === currentFilterUrl}
                >
                  <div className="font-medium text-sm">
                    {getFilterSummary(item.filter_url)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeTime(item.accessed_at)}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/filter-history-insights?organizationId=${organizationId}&adminId=${adminId}`)}
                className="cursor-pointer"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Insights
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleClearHistory}
                className="text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ExportFilterHistoryDialog
        organizationId={organizationId}
        adminId={adminId}
        isOrgAdmin={isOrgAdmin}
      />
    </div>
  );
}
