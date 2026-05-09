import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PasswordStrengthMeter } from '@/components/ui/password-strength-meter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { invitationService } from '@/services/invitationService';
import type { UserRole, Invitation } from '@/types/types';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [organizationName, setOrganizationName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [validatedInvitation, setValidatedInvitation] = useState<Invitation | null>(null);
  const [invitationError, setInvitationError] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const from = (location.state as { from?: string })?.from || '/';

  // Check for invitation code in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && !isLogin) {
      setInvitationCode(codeFromUrl);
      validateInvitationCode(codeFromUrl);
    }
  }, [searchParams, isLogin]);

  const validateInvitationCode = async (code: string) => {
    if (!code.trim()) {
      setValidatedInvitation(null);
      setInvitationError('');
      return;
    }

    const result = await invitationService.validateCode(code);
    
    if (result.valid && result.invitation) {
      setValidatedInvitation(result.invitation);
      setInvitationError('');
      setEmail(result.invitation.email);
      setRole(result.invitation.role);
      toast.success('Valid invitation code! Please complete your registration.');
    } else {
      setValidatedInvitation(null);
      setInvitationError(result.error || 'Invalid invitation code');
      toast.error(result.error || 'Invalid invitation code');
    }
  };

  const handleInvitationCodeChange = (code: string) => {
    setInvitationCode(code.toUpperCase());
    if (code.length === 8) {
      validateInvitationCode(code);
    } else {
      setValidatedInvitation(null);
      setInvitationError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Login validation
      if (!email || !password) {
        toast.error('Please enter email and password');
        return;
      }
    } else {
      // Sign up validation
      if (!email || !firstName || !lastName || !username || !password) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      // Validate organization name for school admins (unless using invitation)
      if (role === 'school_admin' && !validatedInvitation && !organizationName.trim()) {
        toast.error('Please enter your school/organization name');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      
      // Validate username format - should not contain @ symbol
      if (username.includes('@')) {
        toast.error('Username should not contain @ symbol');
        return;
      }
      
      // Validate username format - alphanumeric and underscores only
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        toast.error('Username can only contain letters, numbers, and underscores');
        return;
      }
      
      // Validate password strength
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
      if (!/[A-Z]/.test(password)) {
        toast.error('Password must contain at least one uppercase letter');
        return;
      }
      if (!/[a-z]/.test(password)) {
        toast.error('Password must contain at least one lowercase letter');
        return;
      }
      if (!/[0-9]/.test(password)) {
        toast.error('Password must contain at least one number');
        return;
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        toast.error('Password must contain at least one special character');
        return;
      }
      
      if (!agreedToTerms) {
        toast.error('Please agree to the Terms and Privacy Policy');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      const { error } = isLogin 
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, username);
      
      if (error) {
        toast.error(error.message);
      } else {
        if (isLogin) {
          toast.success('Login successful');
          navigate(from, { replace: true });
        } else {
          toast.success('Registration successful! Please check your email to verify your account.');
          // Redirect to verification reminder page
          navigate('/verify-email-reminder');
        }
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-b9ifsz9pqm80/conv-b9kq4jp3bta8/20260430/file-bauu19qd4jcw.png" 
              alt="ModelMentor Logo" 
              className="h-12 w-auto"
            />
          </div>
          <CardDescription className="text-center">
            {isLogin ? 'Sign in to continue your ML journey' : 'Create an account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
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
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="e.g., johndoe (letters, numbers, underscores)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Choose a unique username (no @ symbol or spaces)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invitationCode">Invitation Code (Optional)</Label>
                    <Input
                      id="invitationCode"
                      type="text"
                      placeholder="Enter 8-character code"
                      value={invitationCode}
                      onChange={(e) => handleInvitationCodeChange(e.target.value)}
                      maxLength={8}
                      className="uppercase"
                    />
                    {validatedInvitation && (
                      <Alert className="border-green-500 bg-green-50">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Valid invitation! You will join as {validatedInvitation.role} in the organization.
                        </AlertDescription>
                      </Alert>
                    )}
                    {invitationError && (
                      <Alert className="border-red-500 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {invitationError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Have an invitation from your school? Enter the code here.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a</Label>
                    <Select 
                      value={role} 
                      onValueChange={(value) => setRole(value as UserRole)}
                      disabled={!!validatedInvitation}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="school_admin">School Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {role === 'student' && 'Students can create projects and learn ML concepts'}
                      {role === 'teacher' && 'Teachers can create assignments and track student progress'}
                      {role === 'school_admin' && 'School admins can manage teachers, students, and groups'}
                      {validatedInvitation && ' (Set by invitation)'}
                    </p>
                  </div>
                  
                  {role === 'school_admin' && !validatedInvitation && (
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">School/Organization Name</Label>
                      <Input
                        id="organizationName"
                        type="text"
                        placeholder="e.g., Lincoln High School"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        This will create a new organization that you will manage
                      </p>
                    </div>
                  )}
                </>
              )}
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {!isLogin && <PasswordStrengthMeter password={password} />}
              
              {!isLogin && (
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the User Agreement and Privacy Policy. By using ModelMentor, you agree to our terms of service and data handling practices.
                  </label>
                </div>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
            
            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
