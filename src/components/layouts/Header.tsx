import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, BookOpen, Award, LayoutDashboard, GraduationCap } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/NotificationBell';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { openTutorial } = useTutorial();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile Logo - Icon Only */}
          <Link 
            to="/" 
            className="md:hidden flex items-center hover:opacity-80 transition-opacity"
            aria-label="ModelMentor Home"
          >
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-b9ifsz9pqm80/conv-b9kq4jp3bta8/20260430/file-bavzr057cbgi.png" 
              alt="ModelMentor Icon" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Logo - Full Logo */}
          <Link to="/" className="hidden md:flex items-center space-x-3 transition-opacity hover:opacity-80">
            <img 
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-b9ifsz9pqm80/conv-b9kq4jp3bta8/20260430/file-bavms1hvny80.png" 
              alt="ModelMentor Logo" 
              className="h-8 w-auto"
            />
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link to="/" className="text-sm hover:text-primary transition-colors">
              Projects
            </Link>
            <Link to="/kaggle-datasets" className="text-sm hover:text-primary transition-colors">
              Datasets
            </Link>
            {user && (profile?.role === 'teacher' || profile?.role === 'admin' || profile?.role === 'super_admin') && (
              <Link to="/teacher-resources" className="text-sm hover:text-primary transition-colors flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                Teacher Resources
              </Link>
            )}
            {user && (
              <Link to="/badges" className="text-sm hover:text-primary transition-colors flex items-center gap-1">
                <Award className="h-4 w-4" />
                Badges
              </Link>
            )}
            {user && (profile?.role === 'admin' || profile?.role === 'super_admin') && (
              <Link to="/dashboard" className="text-sm hover:text-primary transition-colors flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={openTutorial}
              className="text-sm hover:text-primary transition-colors flex items-center gap-1"
              aria-label="Show tutorial"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden lg:inline">Tutorial</span>
            </Button>
            
            <ThemeToggle />
            {user && <NotificationBell />}
            
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar
                        src={profile?.avatar_url || undefined}
                        firstName={profile?.first_name || undefined}
                        lastName={profile?.last_name || undefined}
                        username={profile?.username || undefined}
                        size="sm"
                      />
                      <span className="hidden md:inline">{profile?.username || 'User'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
