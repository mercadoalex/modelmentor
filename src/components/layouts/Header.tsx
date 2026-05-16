import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { useContextualHelp } from '@/contexts/ContextualHelpContext';
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
import {
  LogOut,
  Settings,
  BookOpen,
  Award,
  LayoutDashboard,
  GraduationCap,
  HelpCircle,
  Zap,
  Users,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { NotificationBell } from '@/components/NotificationBell';

// ─────────────────────────────────────────────────────────────────────────────
// Header — top navigation bar shown on every page
// ─────────────────────────────────────────────────────────────────────────────
export function Header() {
  const { user, profile, signOut } = useAuth();
  const { openTutorial }           = useTutorial();
  const { openHelp, currentHelp }  = useContextualHelp();
  const navigate                   = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Convenience role flags
  const isTeacherOrAbove = profile?.role === 'teacher'
    || profile?.role === 'admin'
    || profile?.role === 'super_admin';

  const isAdminOrAbove = profile?.role === 'admin'
    || profile?.role === 'super_admin';

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">

          {/* ── Logo: icon only on mobile, full logo on desktop ── */}
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

          <Link
            to="/"
            className="hidden md:flex items-center space-x-3 transition-opacity hover:opacity-80"
          >
            <img
              src="https://miaoda-conversation-file.s3cdn.medo.dev/user-b9ifsz9pqm80/conv-b9kq4jp3bta8/20260430/file-bavms1hvny80.png"
              alt="ModelMentor Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* ── Navigation links ── */}
          <nav className="flex items-center space-x-6">

            {/* Always visible */}
            <Link to="/" className="text-sm hover:text-primary transition-colors">
              Projects
            </Link>

            <Link to="/kaggle-datasets" className="text-sm hover:text-primary transition-colors">
              Datasets
            </Link>

            {/* Pricing — visible to everyone */}
            <Link
              to="/pricing"
              className="text-sm hover:text-primary transition-colors flex items-center gap-1"
            >
              <Zap className="h-4 w-4" />
              Pricing
            </Link>

            {/* Teacher Resources — teachers and above */}
            {user && isTeacherOrAbove && (
              <Link
                to="/teacher-resources"
                className="text-sm hover:text-primary transition-colors flex items-center gap-1"
              >
                <BookOpen className="h-4 w-4" />
                Teacher Resources
              </Link>
            )}

            {/* Badges — all authenticated users */}
            {user && (
              <Link
                to="/badges"
                className="text-sm hover:text-primary transition-colors flex items-center gap-1"
              >
                <Award className="h-4 w-4" />
                Badges
              </Link>
            )}

            {/* Admin Dashboard — admins and above */}
            {user && isAdminOrAbove && (
              <Link
                to="/dashboard"
                className="text-sm hover:text-primary transition-colors flex items-center gap-1"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}

            {/* Guided Tutorial button */}
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

            {/* Contextual Help button — only shown when help items exist */}
            {currentHelp.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={openHelp}
                className="text-sm hover:text-primary transition-colors flex items-center gap-1 relative"
                aria-label="Show contextual help"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden lg:inline">Help</span>
                {/* Badge showing number of help items */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {currentHelp.length}
                </span>
              </Button>
            )}

            {/* Language toggle (EN / ES) */}
            <LanguageToggle />

            {/* Theme toggle (light / dark) */}
            <ThemeToggle />

            {/* Notification bell — authenticated users only */}
            {user && <NotificationBell />}

            {/* ── User menu (authenticated) or Sign In button (guest) ── */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Avatar
                      src={profile?.avatar_url   || undefined}
                      firstName={profile?.first_name || undefined}
                      lastName={profile?.last_name  || undefined}
                      username={profile?.username   || undefined}
                      size="sm"
                    />
                    <span className="hidden md:inline">{profile?.username || 'User'}</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Settings — all users */}
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>

                  {/* Bulk User Import — admins and super admins only */}
                  {isAdminOrAbove && (
                    <DropdownMenuItem onClick={() => navigate('/admin/bulk-import')}>
                      <Users className="h-4 w-4 mr-2" />
                      Bulk User Import
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {/* Sign out */}
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Guest: show Sign In button */
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