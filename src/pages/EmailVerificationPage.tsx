import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      if (!token || type !== 'email') {
        setStatus('error');
        setErrorMessage('Invalid verification link');
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          setStatus('error');
          setErrorMessage(error.message || 'Verification failed');
        } else {
          setStatus('success');
          toast.success('Email verified successfully!');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (err) {
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

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
            {status === 'verifying' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-16 w-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying Your Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email address...'}
            {status === 'success' && 'Your email has been successfully verified. Redirecting to login...'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Button
                onClick={() => navigate('/verify-email-reminder')}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </Button>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
