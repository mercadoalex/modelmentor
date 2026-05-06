import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Upload, Copy, X, RefreshCw } from 'lucide-react';
import { invitationService } from '@/services/invitationService';
import { toast } from 'sonner';
import type { UserRole, Invitation } from '@/types/types';

interface InvitationManagerProps {
  organizationId: string;
  invitedBy: string;
  onInvitationSent?: () => void;
}

export function InvitationManager({ organizationId, invitedBy, onInvitationSent }: InvitationManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInvitations, setShowInvitations] = useState(false);

  const handleSingleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const invitation = await invitationService.create(
        organizationId,
        email,
        role,
        invitedBy
      );

      if (invitation) {
        toast.success('Invitation created successfully!');
        setInvitations([invitation, ...invitations]);
        setEmail('');
        onInvitationSent?.();
      } else {
        toast.error('Failed to create invitation');
      }
    } catch (error) {
      toast.error('Failed to create invitation');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkInvite = async () => {
    if (!csvText.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    // Parse CSV: email,role
    const lines = csvText.trim().split('\n');
    const invitationsData: Array<{ email: string; role: UserRole }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const [email, roleStr] = line.split(',').map(s => s.trim());
      
      if (!email) {
        toast.error(`Line ${i + 1}: Missing email`);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error(`Line ${i + 1}: Invalid email format`);
        return;
      }

      const validRole = roleStr as UserRole;
      if (!['student', 'teacher', 'school_admin'].includes(validRole)) {
        toast.error(`Line ${i + 1}: Invalid role. Use student, teacher, or school_admin`);
        return;
      }

      invitationsData.push({ email, role: validRole });
    }

    if (invitationsData.length === 0) {
      toast.error('No valid invitations found');
      return;
    }

    setLoading(true);
    try {
      const createdInvitations = await invitationService.createBulk(
        organizationId,
        invitationsData,
        invitedBy
      );

      if (createdInvitations.length > 0) {
        toast.success(`${createdInvitations.length} invitations created successfully!`);
        setInvitations([...createdInvitations, ...invitations]);
        setCsvText('');
        onInvitationSent?.();
      } else {
        toast.error('Failed to create invitations');
      }
    } catch (error) {
      toast.error('Failed to create invitations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = (code: string) => {
    const link = `${window.location.origin}/login?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invitation link copied to clipboard!');
  };

  const copyInvitationCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invitation code copied to clipboard!');
  };

  const handleCancelInvitation = async (id: string) => {
    const success = await invitationService.cancel(id);
    if (success) {
      toast.success('Invitation cancelled');
      setInvitations(invitations.map(inv => 
        inv.id === id ? { ...inv, status: 'cancelled' as const } : inv
      ));
    } else {
      toast.error('Failed to cancel invitation');
    }
  };

  const handleResendInvitation = async (id: string) => {
    const invitation = await invitationService.resend(id);
    if (invitation) {
      toast.success('Invitation resent with new code');
      setInvitations(invitations.map(inv => 
        inv.id === id ? invitation : inv
      ));
    } else {
      toast.error('Failed to resend invitation');
    }
  };

  const loadInvitations = async () => {
    const data = await invitationService.getByOrganization(organizationId);
    setInvitations(data);
    setShowInvitations(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <Badge className={variants[status] || ''}>
        {status}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Send Invitations
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invite Teachers and Students</DialogTitle>
            <DialogDescription>
              Send invitations via email or import multiple users from CSV
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Invitation</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Import (CSV)</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="school_admin">School Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSingleInvite} disabled={loading} className="w-full">
                {loading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv">CSV Data</Label>
                <Textarea
                  id="csv"
                  placeholder="email@example.com,student&#10;teacher@example.com,teacher&#10;admin@example.com,school_admin"
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Format: email,role (one per line). Roles: student, teacher, school_admin
                </p>
              </div>

              <Button onClick={handleBulkInvite} disabled={loading} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Importing...' : 'Import Invitations'}
              </Button>
            </TabsContent>
          </Tabs>

          {invitations.length > 0 && (
            <div className="mt-6 space-y-3 max-h-64 overflow-y-auto">
              <h4 className="font-medium">Recent Invitations</h4>
              {invitations.slice(0, 5).map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{inv.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Code: {inv.code} • Role: {inv.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(inv.status)}
                    {inv.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInvitationLink(inv.code)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvitation(inv.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvitation(inv.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {!showInvitations && (
        <Button variant="outline" onClick={loadInvitations}>
          View All Invitations
        </Button>
      )}
    </>
  );
}
