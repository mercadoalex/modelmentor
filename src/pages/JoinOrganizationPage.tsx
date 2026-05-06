import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Building2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { joinRequestService } from '@/services/joinRequestService';
import { toast } from 'sonner';
import type { Organization, JoinRequest } from '@/types/types';

export default function JoinOrganizationPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile]);

  useEffect(() => {
    filterOrganizations();
  }, [searchQuery, organizations]);

  const loadData = async () => {
    if (!profile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [orgsData, requestsData] = await Promise.all([
        supabase.from('organizations').select('*').order('name'),
        joinRequestService.getByUser(profile.id)
      ]);

      if (orgsData.data) {
        setOrganizations(orgsData.data);
      }
      setMyRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    if (!searchQuery.trim()) {
      setFilteredOrganizations(organizations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = organizations.filter(org =>
      org.name.toLowerCase().includes(query) ||
      org.description?.toLowerCase().includes(query)
    );
    setFilteredOrganizations(filtered);
  };

  const getRequestStatus = (orgId: string): JoinRequest | undefined => {
    return myRequests.find(req => req.organization_id === orgId);
  };

  const handleRequestJoin = async () => {
    if (!selectedOrg || !profile) return;

    setSubmitting(true);
    try {
      const request = await joinRequestService.create(
        selectedOrg.id,
        profile.id,
        requestMessage.trim() || undefined
      );

      if (request) {
        toast.success('Join request submitted successfully!');
        setMyRequests([request, ...myRequests]);
        setIsDialogOpen(false);
        setSelectedOrg(null);
        setRequestMessage('');
      } else {
        toast.error('Failed to submit join request');
      }
    } catch (error) {
      toast.error('Failed to submit join request');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const openRequestDialog = (org: Organization) => {
    setSelectedOrg(org);
    setRequestMessage('');
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; icon: React.ReactNode; text: string }> = {
      pending: {
        className: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="h-3 w-3 mr-1" />,
        text: 'Pending'
      },
      approved: {
        className: 'bg-green-100 text-green-800',
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
        text: 'Approved'
      },
      rejected: {
        className: 'bg-red-100 text-red-800',
        icon: <XCircle className="h-3 w-3 mr-1" />,
        text: 'Rejected'
      }
    };

    const variant = variants[status] || variants.pending;
    return (
      <Badge className={variant.className}>
        {variant.icon}
        {variant.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </AppLayout>
    );
  }

  if (profile?.organization_id) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Already in Organization</CardTitle>
              <CardDescription>
                You are already a member of an organization. If you need to change organizations, please contact your administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')}>Go to Home</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Join an Organization</h1>
          <p className="text-muted-foreground">
            Browse available organizations and request to join
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* My Requests */}
        {myRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">My Requests</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myRequests.map((request) => {
                const org = organizations.find(o => o.id === request.organization_id);
                if (!org) return null;

                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-lg">{org.name}</CardTitle>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                      {org.description && (
                        <CardDescription>{org.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          Requested: {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.message && (
                          <div>
                            <p className="font-medium">Your message:</p>
                            <p className="text-muted-foreground">{request.message}</p>
                          </div>
                        )}
                        {request.admin_message && (
                          <div>
                            <p className="font-medium">Admin response:</p>
                            <p className="text-muted-foreground">{request.admin_message}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Organizations */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Available Organizations</h2>
          {filteredOrganizations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {searchQuery ? 'No organizations found matching your search' : 'No organizations available'}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrganizations.map((org) => {
                const existingRequest = getRequestStatus(org.id);

                return (
                  <Card key={org.id}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                      </div>
                      {org.description && (
                        <CardDescription>{org.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {existingRequest ? (
                        <div className="flex items-center gap-2">
                          {getStatusBadge(existingRequest.status)}
                          <span className="text-sm text-muted-foreground">
                            {existingRequest.status === 'pending' && 'Request pending'}
                            {existingRequest.status === 'approved' && 'Request approved'}
                            {existingRequest.status === 'rejected' && 'Request rejected'}
                          </span>
                        </div>
                      ) : (
                        <Button onClick={() => openRequestDialog(org)} className="w-full">
                          Request to Join
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Send a request to join this organization. You can include a message explaining why you'd like to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Tell the admin why you'd like to join this organization..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
            </div>
            <Button
              onClick={handleRequestJoin}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
