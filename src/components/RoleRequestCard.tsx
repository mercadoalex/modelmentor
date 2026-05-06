import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/db/supabase';
import { UserCog, Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { RoleRequest } from '@/types/types';

export function RoleRequestCard() {
  const { user, profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RoleRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPendingRequest();
    }
  }, [user]);

  const loadPendingRequest = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_requests')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      setPendingRequest(data);
    } catch (error) {
      console.error('Error loading pending request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for your request');
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('role_requests')
        .insert({
          user_id: user!.id,
          requested_role: 'teacher',
          reason: reason.trim(),
          status: 'pending',
        });

      if (error) throw error;

      toast.success('Role request submitted successfully');
      setDialogOpen(false);
      setReason('');
      loadPendingRequest();
    } catch (error) {
      toast.error('Failed to submit role request');
      console.error('Error submitting request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  // Don't show for admins, super admins, or teachers
  if (profile?.role === 'admin' || profile?.role === 'teacher' || profile?.role === 'super_admin') {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Role Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Role Request
          </CardTitle>
          <CardDescription>
            Request elevated permissions for teaching features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingRequest ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                {getStatusBadge(pendingRequest.status)}
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Your Request:</span>
                <p className="text-sm text-muted-foreground">
                  {pendingRequest.reason}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Submitted on {new Date(pendingRequest.created_at).toLocaleDateString()}
              </div>
              {pendingRequest.admin_notes && (
                <div className="space-y-1 p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Admin Notes:</span>
                  <p className="text-sm text-muted-foreground">
                    {pendingRequest.admin_notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Request teacher role to access advanced features like lesson plans,
                classroom management, and student progress tracking.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="w-full">
                <UserCog className="h-4 w-4 mr-2" />
                Request Teacher Role
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Teacher Role</DialogTitle>
            <DialogDescription>
              Please explain why you need teacher access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Request</Label>
              <Textarea
                id="reason"
                placeholder="I am a teacher at [school name] and would like to use ModelMentor with my students..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Please provide details about your teaching role and how you plan to use
                ModelMentor.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={submitting || !reason.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
