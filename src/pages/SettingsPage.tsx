import { AppLayout } from '@/components/layouts/AppLayout';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useContextualHelp } from '@/contexts/ContextualHelpContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/AvatarUpload';
import { RoleRequestCard } from '@/components/RoleRequestCard';
import { supabase } from '@/db/supabase';
import { User, Lock, Bell, Trash2, AlertTriangle, Loader2, CheckCircle2, ArrowLeft, Mail, HelpCircle, RotateCcw, BarChart3, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { EmailPreferences } from '@/types/types';

function UsageDashboard() {
  const { isAuthenticated } = useAuth();
  const { tier, usage, limits, warnings, isOnTrial, trialDaysRemaining, loading } = useSubscription();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-3">
            <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">Sign in to view your usage and plan details.</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const resources: Array<{
    label: string;
    used: number;
    limit: number | null;
    unit?: string;
  }> = [
    { label: 'Projects', used: usage.projects, limit: limits.max_projects },
    { label: 'Training Sessions', used: usage.training_sessions, limit: limits.max_training_sessions_per_month, unit: '/month' },
    { label: 'Storage', used: usage.storage_mb, limit: limits.max_storage_mb, unit: ' MB' },
  ];

  const getPercentUsed = (used: number, limit: number | null): number => {
    if (limit === null || limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const isAtWarning = (used: number, limit: number | null): boolean => {
    if (limit === null) return false;
    return used >= limit * 0.8;
  };

  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const hasWarnings = warnings.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage & Limits
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>Current plan:</span>
            <Badge variant={tier === 'enterprise' ? 'default' : tier === 'pro' ? 'default' : 'secondary'}>
              {tierLabel}
            </Badge>
            {isOnTrial && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Trial — {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {resources.map(({ label, used, limit, unit }) => {
            const percent = getPercentUsed(used, limit);
            const atWarning = isAtWarning(used, limit);
            const isUnlimited = limit === null;

            return (
              <div key={label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn('font-medium', atWarning && 'text-amber-600')}>
                    {label}
                  </span>
                  <span className={cn('text-muted-foreground', atWarning && 'text-amber-600 font-medium')}>
                    {isUnlimited
                      ? `${used}${unit || ''} — Unlimited`
                      : `${used} / ${limit}${unit || ''}`}
                  </span>
                </div>
                {isUnlimited ? (
                  <Progress value={0} className="h-2" />
                ) : (
                  <Progress
                    value={percent}
                    className={cn(
                      'h-2',
                      atWarning && '[&>*]:bg-amber-500',
                      percent >= 100 && '[&>*]:bg-red-500'
                    )}
                  />
                )}
                {atWarning && !isUnlimited && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {percent >= 100 ? 'Limit reached' : `${percent}% used — approaching limit`}
                  </p>
                )}
              </div>
            );
          })}

          {hasWarnings && tier !== 'enterprise' && (
            <>
              <Separator />
              <Alert className="border-amber-300 bg-amber-50">
                <Zap className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  You're approaching your plan limits. Upgrade to get more resources and unlock additional features.
                </AlertDescription>
              </Alert>
            </>
          )}

          {tier !== 'enterprise' && (
            <>
              <Separator />
              <Button onClick={() => navigate('/pricing')} className="gap-2">
                <Zap className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const { resetDismissed, dismissedTips } = useContextualHelp();
  const navigate = useNavigate();
  
  // Profile settings
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  // Email preferences
  const [emailPreferences, setEmailPreferences] = useState<EmailPreferences | null>(null);
  const [roleChangeNotifications, setRoleChangeNotifications] = useState(true);
  const [roleRequestNotifications, setRoleRequestNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [emailPrefsLoading, setEmailPrefsLoading] = useState(false);
  
  // Delete account
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load profile data
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setUsername(profile.username || '');
      setEmail(user.email || '');
      setAvatarUrl(profile.avatar_url || null);
    }
    
    // Load email preferences
    loadEmailPreferences();
  }, [user, profile, navigate]);
  
  const loadEmailPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setEmailPreferences(data);
        setRoleChangeNotifications(data.role_change_notifications);
        setRoleRequestNotifications(data.role_request_notifications);
        setWeeklyDigest(data.weekly_digest);
      } else {
        // Create default preferences if they don't exist
        const { data: newPrefs, error: insertError } = await supabase
          .from('email_preferences')
          .insert({
            user_id: user.id,
            role_change_notifications: true,
            role_request_notifications: true,
            weekly_digest: false,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        if (newPrefs) {
          setEmailPreferences(newPrefs);
          setRoleChangeNotifications(newPrefs.role_change_notifications);
          setRoleRequestNotifications(newPrefs.role_request_notifications);
          setWeeklyDigest(newPrefs.weekly_digest);
        }
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return;
    }
    
    setProfileLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Username already taken');
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }
    
    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }
    
    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number');
      return;
    }
    
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one special character');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword
      });
      
      if (signInError) {
        toast.error('Current password is incorrect');
        setPasswordLoading(false);
        return;
      }
      
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error('Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setNotificationsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', user!.id);
      
      if (error) throw error;
      
      toast.success('Notification preferences updated');
    } catch (error) {
      toast.error('Failed to update notification preferences');
    } finally {
      setNotificationsLoading(false);
    }
  };
  
  const handleUpdateEmailPreferences = async () => {
    if (!user) return;
    
    setEmailPrefsLoading(true);
    
    try {
      const { error } = await supabase
        .from('email_preferences')
        .update({
          role_change_notifications: roleChangeNotifications,
          role_request_notifications: roleRequestNotifications,
          weekly_digest: weeklyDigest,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Email preferences updated successfully');
      loadEmailPreferences();
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences');
    } finally {
      setEmailPrefsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    
    setDeleteLoading(true);
    
    try {
      // Delete user profile (cascade will handle related data)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user!.id);
      
      if (profileError) throw profileError;
      
      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(user!.id);
      
      if (authError) {
        // If admin delete fails, try regular sign out
        await signOut();
      }
      
      toast.success('Account deleted successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to delete account. Please contact support.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppLayout>
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Button>

        <div>
          <h1 className="text-3xl font-semibold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and profile picture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div>
                    <Label className="mb-4 block">Profile Picture</Label>
                    <AvatarUpload
                      userId={user!.id}
                      currentAvatarUrl={avatarUrl}
                      firstName={firstName}
                      lastName={lastName}
                      username={username}
                      onUploadComplete={(url) => setAvatarUrl(url)}
                      onRemove={() => setAvatarUrl(null)}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Letters, numbers, and underscores only
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input
                      value={profile.role}
                      disabled
                      className="bg-muted capitalize"
                    />
                  </div>
                  
                  <Separator />
                  
                  <Button type="submit" disabled={profileLoading}>
                    {profileLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <UsageDashboard />
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      At least 8 characters with uppercase, lowercase, number, and special character
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <Separator />
                  
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about your projects and activities
                      </p>
                    </div>
                    <Button
                      variant={emailNotifications ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEmailNotifications(!emailNotifications)}
                    >
                      {emailNotifications ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <Button onClick={handleUpdateNotifications} disabled={notificationsLoading}>
                    {notificationsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose which email notifications you want to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="role-change" className="font-medium cursor-pointer">
                          Role Change Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when an administrator changes your role
                        </p>
                      </div>
                      <Switch
                        id="role-change"
                        checked={roleChangeNotifications}
                        onCheckedChange={setRoleChangeNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="role-request" className="font-medium cursor-pointer">
                          Role Request Updates
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive updates when your role requests are approved or rejected
                        </p>
                      </div>
                      <Switch
                        id="role-request"
                        checked={roleRequestNotifications}
                        onCheckedChange={setRoleRequestNotifications}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1 flex-1">
                        <Label htmlFor="weekly-digest" className="font-medium cursor-pointer">
                          Weekly Digest
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Get a weekly summary of your activity and progress
                        </p>
                      </div>
                      <Switch
                        id="weekly-digest"
                        checked={weeklyDigest}
                        onCheckedChange={setWeeklyDigest}
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      Important notifications like security alerts will always be sent regardless of your preferences.
                    </AlertDescription>
                  </Alert>

                  <Separator />

                  <Button onClick={handleUpdateEmailPreferences} disabled={emailPrefsLoading}>
                    {emailPrefsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Save Email Preferences
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Help & Learning
                  </CardTitle>
                  <CardDescription>
                    Manage contextual help and tutorial preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="space-y-1">
                      <p className="font-medium">Contextual Help Tips</p>
                      <p className="text-sm text-muted-foreground">
                        Reset all dismissed help tips to see them again. You have dismissed {dismissedTips.size} tip{dismissedTips.size !== 1 ? 's' : ''}.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        resetDismissed();
                        toast.success('All help tips have been reset');
                      }}
                      disabled={dismissedTips.size === 0}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset Help Tips
                    </Button>
                  </div>

                  <Alert>
                    <AlertDescription className="text-sm">
                      Help tips provide contextual guidance based on the page you're viewing. They appear automatically when you visit different sections of the app.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-6">
              {/* Role Request Card */}
              <RoleRequestCard />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Account Management
                  </CardTitle>
                  <CardDescription>
                    Manage your account and data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Account Information</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Account created: {new Date(profile.created_at).toLocaleDateString()}</p>
                        <p>Last updated: {new Date(profile.updated_at).toLocaleDateString()}</p>
                        <p>User ID: {user.id}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2 text-red-600">Danger Zone</h3>
                      <Alert className="border-red-500 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <p className="font-medium mb-2">Delete Account</p>
                          <p className="text-sm mb-4">
                            Once you delete your account, there is no going back. This will permanently delete your profile, projects, and all associated data.
                          </p>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor="deleteConfirmation" className="text-red-800">
                                Type <strong>DELETE</strong> to confirm
                              </Label>
                              <Input
                                id="deleteConfirmation"
                                type="text"
                                placeholder="DELETE"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="border-red-300"
                              />
                            </div>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={deleteLoading || deleteConfirmation !== 'DELETE'}
                            >
                              {deleteLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Account Permanently
                              </>
                            )}
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AppLayout>
  );
}
