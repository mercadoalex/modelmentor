import ProjectCreationPage from './pages/ProjectCreationPage';
import DataCollectionPage from './pages/DataCollectionPage';
import InteractiveLearningPage from './pages/InteractiveLearningPage';
import TrainingPage from './pages/TrainingPage';
import DebuggingSandboxPage from './pages/DebuggingSandboxPage';
import TestingPage from './pages/TestingPage';
import ExportPage from './pages/ExportPage';
import LoginPage from './pages/LoginPage';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Profile } from './pages/Profile';
import EmailVerificationPage from './pages/EmailVerificationPage';
import VerifyEmailReminderPage from './pages/VerifyEmailReminderPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TeacherResourcesPage from './pages/TeacherResourcesPage';
import BadgesPage from './pages/BadgesPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentDetailPage from './pages/StudentDetailPage';
import AtRiskAlertsPage from './pages/AtRiskAlertsPage';
import ReportsPage from './pages/ReportsPage';
import SchoolAdminPage from './pages/SchoolAdminPage';
import JoinOrganizationPage from './pages/JoinOrganizationPage';
import FilterHistoryInsightsPage from './pages/FilterHistoryInsightsPage';
import SettingsPage from './pages/SettingsPage';
import RoleManagementPage from './pages/RoleManagementPage';
import KaggleDatasetsPage from './pages/KaggleDatasetsPage';
import TutorialsPage from './pages/TutorialsPage';
import QuizAnalyticsPage from './pages/QuizAnalyticsPage';
import ProgressPage from './pages/ProgressPage';
import ConceptsVisualizerPage from './pages/ConceptsVisualizerPage';
import TeacherQuestionGeneratorPage from './pages/TeacherQuestionGeneratorPage';
import { SuperAdminDashboardPage } from './pages/SuperAdminDashboardPage';
import type { ReactNode } from 'react';
import PricingPage from './pages/PricingPage';
import BulkUserImportPage from './pages/BulkUserImportPage';
import SharedConfigurationPage from './pages/SharedConfigurationPage';


export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Home',
    path: '/',
    element: <ProjectCreationPage />,
    public: true,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    public: true,
  },
  {
    name: 'Signup',
    path: '/signup',
    element: <Signup />,
    public: true,
  },
  {
    name: 'Forgot Password',
    path: '/forgot-password',
    element: <ForgotPassword />,
    public: true,
  },
  {
    name: 'Reset Password',
    path: '/reset-password',
    element: <ResetPasswordPage />,
    public: true,
  },
  {
    name: 'Email Verification',
    path: '/verify-email',
    element: <EmailVerificationPage />,
    public: true,
  },
  {
    name: 'Verify Email Reminder',
    path: '/verify-email-reminder',
    element: <VerifyEmailReminderPage />,
    public: true,
  },
  {
    name: 'Teacher Resources',
    path: '/teacher-resources',
    element: <TeacherResourcesPage />,
    visible: true,
    public: true,
  },
  {
    name: 'Badges',
    path: '/badges',
    element: <BadgesPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Settings',
    path: '/settings',
    element: <SettingsPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Profile',
    path: '/profile',
    element: <Profile />,
    visible: false,
    public: false,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <TeacherDashboardPage />,
    visible: true,
    public: false,
  },
  {
    name: 'School Admin',
    path: '/admin',
    element: <SchoolAdminPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Join Organization',
    path: '/join-organization',
    element: <JoinOrganizationPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Student Detail',
    path: '/dashboard/student/:studentId',
    element: <StudentDetailPage />,
    public: false,
  },
  {
    name: 'At-Risk Alerts',
    path: '/dashboard/alerts',
    element: <AtRiskAlertsPage />,
    public: false,
  },
  {
    name: 'Reports',
    path: '/dashboard/reports',
    element: <ReportsPage />,
    public: false,
  },
  {
    name: 'Data Collection',
    path: '/project/:projectId/data-collection',
    element: <DataCollectionPage />,
    public: true,
  },
  {
    name: 'Learning',
    path: '/project/:projectId/learning',
    element: <InteractiveLearningPage />,
    public: true,
  },
  {
    name: 'Training',
    path: '/project/:projectId/training',
    element: <TrainingPage />,
    public: true,
  },
  {
    name: 'Debugging Sandbox',
    path: '/project/:projectId/debugging',
    element: <DebuggingSandboxPage />,
    public: true,
  },
  {
    name: 'Testing',
    path: '/project/:projectId/testing',
    element: <TestingPage />,
    public: true,
  },
  {
    name: 'Export',
    path: '/project/:projectId/export',
    element: <ExportPage />,
    public: true,
  },
  {
    name: 'Filter History Insights',
    path: '/filter-history-insights',
    element: <FilterHistoryInsightsPage />,
  },
  {
    name: 'Role Management',
    path: '/admin/role-management',
    element: <RoleManagementPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Kaggle Datasets',
    path: '/kaggle-datasets',
    element: <KaggleDatasetsPage />,
    visible: true,
    public: true,
  },
  {
    name: 'Tutorials',
    path: '/tutorials',
    element: <TutorialsPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Quiz Analytics',
    path: '/quiz-analytics',
    element: <QuizAnalyticsPage />,
    visible: false,
    public: false,
  },
  {
    name: 'My Progress',
    path: '/progress',
    element: <ProgressPage />,
    visible: true,
    public: false,
  },
  {
    name: 'ML Concepts',
    path: '/concepts',
    element: <ConceptsVisualizerPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Question Generator',
    path: '/teacher/questions',
    element: <TeacherQuestionGeneratorPage />,
    visible: true,
    public: false,
  },
  {
    name: 'Super Admin',
    path: '/super-admin',
    element: <SuperAdminDashboardPage />,
    visible: true,
    public: false,
  },
    {
    name:    'Bulk User Import',
    path:    '/admin/bulk-import',
    element: <BulkUserImportPage />,
    visible: false,
    public:  false,
  },
  {
  name:    'Pricing',
  path:    '/pricing',
  element: <PricingPage />,
  visible: true,
  public:  true,
  },
  {
    name:    'Shared Configuration',
    path:    '/sandbox/shared/:token',
    element: <SharedConfigurationPage />,
    visible: false,
    public:  true,
  },
];
