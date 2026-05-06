import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmailReminderPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!user) {
      navigate('/login');
      return;
    }

    // If email is already verified, redirect to home
    if (user.email_confirmed_at) {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (!user?.email) {
      toast.error('No email address found');
      return;
    }

    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) {
        toast.error(error.message);
      } else {
        setEmailSent(true);
        setCooldown(60);
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      toast.error('Failed to send verification email');
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-b9ifsz9pqm80/conv-b9kq4jp3bta8/20260430/file-bauu19qd4jcw.png" 
              alt="ModelMentor Logo" 
              className="h-12 w-auto"
            />
          </div>
          <div className="flex justify-center">
            {emailSent ? (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            ) : (
              <Mail className="h-16 w-16 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            {emailSent ? (
              <>
                We've sent a verification email to <strong>{user.email}</strong>.
                Please check your inbox and click the confirmation link.
              </>
            ) : (
              <>
                Please verify your email address to access ModelMentor.
                We sent a verification email to <strong>{user.email}</strong>.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Didn't receive the email?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Check your spam or junk folder</li>
              <li>Make sure {user.email} is correct</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>

          <Button
            onClick={handleResendEmail}
            disabled={resending || cooldown > 0}
            className="w-full"
          >
            {resending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full"
          >
            Sign Out
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            After verifying your email, please sign in again to access the platform.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
