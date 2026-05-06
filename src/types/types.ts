export type UserRole = 'user' | 'admin' | 'student' | 'teacher' | 'school_admin' | 'super_admin';

export type ModelType = 'image_classification' | 'text_classification' | 'regression';

export type ProjectStatus = 'draft' | 'data_collection' | 'learning' | 'training' | 'testing' | 'completed';

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export type JoinRequestStatus = 'pending' | 'approved' | 'rejected';

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected';

export type GroupActivityType = 'member_added' | 'member_removed' | 'instructor_assigned' | 'instructor_removed';

export type BulkActionType = 'bulk_approve' | 'bulk_reject' | 'bulk_undo';

export type BulkActionItemStatus = 'success' | 'failed';

export type ActivityType = 'view' | 'filter' | 'export' | 'rollback' | 'note';

export interface BulkAction {
  id: string;
  organization_id: string;
  admin_id: string;
  action_type: BulkActionType;
  request_count: number;
  success_count: number;
  failed_count: number;
  message: string | null;
  notes: string | null;
  created_at: string;
  rollback_at: string | null;
  rollback_by: string | null;
}

export interface BulkActionItem {
  id: string;
  bulk_action_id: string;
  request_id: string;
  status: BulkActionItemStatus;
  error_message: string | null;
  created_at: string;
}

export interface GroupActivity {
  id: string;
  group_id: string;
  user_id: string;
  target_user_id: string;
  action_type: GroupActivityType;
  notes: string | null;
  created_at: string;
}

export interface JoinRequest {
  id: string;
  organization_id: string;
  user_id: string;
  status: JoinRequestStatus;
  message: string | null;
  admin_message: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  code: string;
  status: InvitationStatus;
  expires_at: string;
  invited_by: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  added_by: string | null;
  is_instructor: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  role: UserRole;
  organization_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserTries {
  id: string;
  user_id: string | null;
  session_id: string;
  tries_count: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string | null;
  session_id: string | null;
  title: string;
  description: string;
  model_type: ModelType;
  status: ProjectStatus;
  is_guided_tour: boolean;
  created_at: string;
  updated_at: string;
}

export interface SampleDataset {
  id: string;
  name: string;
  description: string;
  model_type: ModelType;
  data_url: string | null;
  preview_image: string | null;
  sample_count: number;
  created_at: string;
}

export interface Dataset {
  id: string;
  project_id: string;
  sample_dataset_id: string | null;
  file_urls: string[];
  labels: string[];
  sample_count: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  project_id: string;
  dataset_id: string;
  epochs: number;
  current_epoch: number;
  accuracy: number | null;
  loss: number | null;
  metrics: Record<string, unknown> | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TestResult {
  id: string;
  training_session_id: string;
  test_data: Record<string, unknown>;
  predictions: Record<string, unknown>;
  confusion_matrix: Record<string, unknown> | null;
  accuracy: number | null;
  created_at: string;
}

export interface TrainingMetrics {
  epoch: number;
  accuracy: number;
  loss: number;
}

export interface ConfusionMatrix {
  labels: string[];
  matrix: number[][];
}

export interface ModelVersion {
  id: string;
  project_id: string;
  version_number: number;
  version_name: string | null;
  training_session_id: string | null;
  dataset_id: string | null;
  accuracy: number | null;
  loss: number | null;
  precision: number | null;
  recall: number | null;
  f1_score: number | null;
  epochs: number | null;
  batch_size: number | null;
  learning_rate: number | null;
  feature_count: number | null;
  sample_count: number | null;
  class_labels: string[] | null;
  changes_from_previous: Record<string, unknown> | null;
  notes: string | null;
  is_active: boolean;
  is_deployed: boolean;
  created_at: string;
  created_by: string | null;
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  status: 'pending' | 'accepted' | 'declined';
}

export interface SharedExperiment {
  id: string;
  project_id: string;
  training_session_id: string | null;
  model_version_id: string | null;
  shared_by: string;
  title: string;
  description: string | null;
  metrics: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  is_public: boolean;
  created_at: string;
}

export interface ExperimentComment {
  id: string;
  experiment_id: string;
  user_id: string;
  comment: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollaborationActivity {
  id: string;
  project_id: string;
  user_id: string;
  activity_type: 'experiment_shared' | 'comment_added' | 'collaborator_added' | 'model_updated' | 'dataset_updated';
  activity_data: Record<string, unknown> | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface LearningContent {
  title: string;
  description: string;
  visual: string;
  concepts: string[];
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ProjectCompletion {
  id: string;
  user_id: string;
  project_id: string;
  example_text: string;
  difficulty: DifficultyLevel;
  completed_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_level: DifficultyLevel;
  earned_at: string;
}

export interface BadgeProgress {
  level: DifficultyLevel;
  totalExamples: number;
  completedExamples: number;
  isEarned: boolean;
  earnedAt?: string;
}

export type ConceptName = 'gradient_descent' | 'overfitting' | 'bias_variance' | 'regularization' | 'model_evaluation';

export interface StudentActivity {
  id: string;
  user_id: string;
  activity_type: 'project_created' | 'quiz_completed' | 'training_completed' | 'concept_viewed';
  activity_data: Record<string, unknown> | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface ConceptMastery {
  id: string;
  user_id: string;
  concept_name: ConceptName;
  mastery_score: number;
  attempts: number;
  last_attempt_at: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  concept_name: string;
  question_id: string;
  is_correct: boolean;
  answer_given: string | null;
  time_spent_seconds: number | null;
  created_at: string;
}

export interface AtRiskAlert {
  id: string;
  user_id: string;
  concept_name: string;
  alert_type: 'low_score' | 'extended_time' | 'repeated_errors' | 'no_activity';
  severity: 'low' | 'medium' | 'high';
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export interface StudentProgress {
  student: Profile;
  totalProjects: number;
  completedProjects: number;
  averageScore: number;
  conceptMastery: ConceptMastery[];
  recentActivity: StudentActivity[];
  badges: UserBadge[];
  alerts: AtRiskAlert[];
}

export type ReportType = 'student_progress' | 'concept_mastery' | 'at_risk' | 'class_summary';
export type ReportFrequency = 'weekly' | 'monthly';
export type ReportFormat = 'pdf' | 'csv';
export type DeliveryStatus = 'pending' | 'success' | 'error';

export interface ScheduledReport {
  id: string;
  user_id: string;
  report_name: string;
  report_type: ReportType;
  frequency: ReportFrequency;
  delivery_day: number | null;
  recipients: string[];
  filters: {
    student_ids?: string[];
    concept_names?: ConceptName[];
    date_range?: {
      start: string;
      end: string;
    };
  };
  format: ReportFormat;
  include_charts: boolean;
  is_active: boolean;
  delivery_status: DeliveryStatus;
  last_error: string | null;
  delivery_count: number;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryLog {
  id: string;
  scheduled_report_id: string;
  status: 'success' | 'error';
  email_id: string | null;
  error_message: string | null;
  recipients: string[];
  retry_attempts: number;
  created_at: string;
}

export interface ReportData {
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  students: StudentProgress[];
  conceptAverages: {
    concept: string;
    average: number;
    struggling: number;
  }[];
  totalStudents: number;
  averageScore: number;
  atRiskCount: number;
}

export interface SandboxConfiguration {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  model_type: string;
  learning_rate: number;
  normalization: boolean;
  batch_size: number;
  epochs: number;
  failure_mode: string | null;
  is_assignment: boolean;
  assignment_title: string | null;
  assignment_instructions: string | null;
  assignment_due_date: string | null;
  notify_students: boolean;
  created_at: string;
  updated_at: string;
}

export interface SharedConfiguration {
  id: string;
  configuration_id: string;
  share_token: string;
  is_assignment: boolean;
  assignment_instructions: string | null;
  created_at: string;
}

export interface CustomFailureScenario {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  model_type: string;
  learning_rate: number;
  normalization: boolean;
  batch_size: number;
  epochs: number;
  usage_count: number;
  share_token: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentCompletion {
  id: string;
  configuration_id: string;
  student_id: string;
  viewed_at: string | null;
  loaded_at: string | null;
  completed_at: string | null;
  time_spent_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed';

export interface ScenarioHistoryItem {
  id: string;
  timestamp: Date;
  scenarioName: string;
  scenarioType: 'pre-loaded' | 'custom';
  configuration: {
    learningRate: number;
    normalization: boolean;
    batchSize: string;
    epochs: string;
  };
}

export interface RoleChange {
  id: string;
  user_id: string;
  changed_by: string;
  old_role: UserRole;
  new_role: UserRole;
  reason: string | null;
  created_at: string;
  user?: Profile;
  changed_by_user?: Profile;
}

export interface RoleRequest {
  id: string;
  user_id: string;
  requested_role: UserRole;
  status: RoleRequestStatus;
  reason: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: Profile;
  reviewer?: Profile;
}

export interface EmailPreferences {
  id: string;
  user_id: string;
  role_change_notifications: boolean;
  role_request_notifications: boolean;
  weekly_digest: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'role_change' | 'assignment' | 'training_complete' | 'role_request';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export interface KaggleDataset {
  id: string;
  title: string;
  description: string;
  creator: string;
  creatorUrl: string;
  size: number;
  sizeFormatted: string;
  url: string;
  lastUpdated: string;
  downloads: number;
  votes: number;
  usabilityRating: number;
}

export interface KaggleSearchResult {
  datasets: KaggleDataset[];
  page: number;
  pageSize: number;
  total: number;
}
