'use server';

import { cookies } from 'next/headers';
import { ApiError } from './client';
import { buildBackendUrl } from './backend-url';
import { logger } from '@/lib/logger';

/**
 * Make an authenticated API request to the backend
 */
async function authFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('teamlead-auth-token')?.value;
  const userInfoCookie = cookieStore.get('teamlead-user-info')?.value;

  if (!token) {
    logger.warn('Missing auth token for backend request', { endpoint });
    throw new ApiError('No authentication token found', 401);
  }

  if (isTokenExpired(token)) {
    logger.warn('Auth token expired', { endpoint });
    throw new ApiError('Session expired', 401);
  }

  // Parse user ID from user info cookie for X-User-ID header
  let userId: string | undefined;
  if (userInfoCookie) {
    try {
      const userInfo = JSON.parse(userInfoCookie);
      userId = userInfo.id || userInfo.employeeId;
    } catch {
      // Ignore parse errors
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options?.headers as Record<string, string>),
  };

  // Add X-User-ID header if available (required by some endpoints)
  if (userId) {
    headers['X-User-ID'] = userId;
  }

  let response: Response;
  try {
    response = await fetch(buildBackendUrl(endpoint), {
      ...options,
      headers,
    });
  } catch (error) {
    logger.error('Backend request failed to reach server', {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new ApiError(
      'Unable to reach the server. Check your connection or API URL.',
      503
    );
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Request failed' }));
    const message = error.message || error.error || 'Request failed';
    logger.warn('Backend request failed', {
      endpoint,
      status: response.status,
    });
    throw new ApiError(message, response.status, error);
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;
    const normalized = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=');
    const decoded = JSON.parse(
      Buffer.from(normalized, 'base64').toString('utf8')
    );
    const exp = decoded?.exp;
    const expSeconds = typeof exp === 'number' ? exp : Number(exp);
    if (!Number.isFinite(expSeconds)) return true;
    return Date.now() >= expSeconds * 1000;
  } catch {
    return true;
  }
}

export interface ReferenceOption {
  value: string;
  label: string;
}

export interface ReferenceCriterion {
  key: string;
  name: string;
  description: string;
}

export interface ReferenceData {
  featureFlags: {
    messagingEnabled: boolean;
  };
  taskStatuses: ReferenceOption[];
  taskStatusFilters: ReferenceOption[];
  taskPriorities: ReferenceOption[];
  taskPriorityFilters: ReferenceOption[];
  kpiProgressSources: ReferenceOption[];
  weeklyReportCriteria: ReferenceCriterion[];
  peerFeedbackCriteria: {
    peer: ReferenceCriterion[];
    leadership: ReferenceCriterion[];
  };
  compliancePolicyTypes: ReferenceOption[];
  reportTypes: ReferenceOption[];
  auditEntityTypes: string[];
  smartReminderTypes: ReferenceOption[];
  smartReminderChannels: string[];
  smartReminderTargets: ReferenceOption[];
  daysOfWeek: string[];
  genders: string[];
  attendanceLateReasons: string[];
}

export async function getReferenceData(): Promise<ReferenceData> {
  return authFetch<ReferenceData>('/api/reference-data');
}

// ================================
// Dashboard Stats
// ================================

export interface DashboardStats {
  team_lead_id: string;
  team_lead_name: string;
  department: string;
  team_size: number;
  tasks: {
    completed: number;
    in_progress: number;
    pending: number;
    total: number;
  };
  weekly_reports: {
    current_week: number;
    year: number;
    reports_submitted: number;
    reports_required: number;
    is_complete: boolean;
  };
  team_performance: {
    average_aura_score: number;
    members_with_aura_data: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return authFetch<DashboardStats>('/api/team-lead/dashboard-stats');
}

// ================================
// Team Members
// ================================

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  job_title: string | null;
  department: string;
  status: string | null;
  employee_id: string | null;
  is_team_lead: boolean;
  avatar_url: string;
  aura_score: number | null;
  aura_grade: string;
  pillars: {
    technical: number;
    behavioral: number;
    culture: number;
    growth: number;
  } | null;
  weekly_report_submitted: boolean;
}

export interface TeamMembersResponse {
  team_lead: string;
  department: string;
  current_week: number;
  year: number;
  member_count: number;
  members: TeamMember[];
}

export async function getTeamMembers(
  includeSelf: boolean = true
): Promise<TeamMembersResponse> {
  return authFetch<TeamMembersResponse>(
    `/api/team-lead/team-members?includeSelf=${includeSelf}`
  );
}

// ================================
// Weekly Report Status
// ================================

export interface MemberReportStatus {
  employee_id: string;
  full_name: string;
  submitted: boolean;
}

export interface WeeklyReportStatusResponse {
  team_lead_id: string;
  week: number;
  year: number;
  team_size: number;
  submitted_count: number;
  pending_count: number;
  is_complete: boolean;
  members: MemberReportStatus[];
}

export async function getWeeklyReportStatus(
  week?: number,
  year?: number
): Promise<WeeklyReportStatusResponse> {
  const params = new URLSearchParams();
  if (week) params.set('week', week.toString());
  if (year) params.set('year', year.toString());

  const queryString = params.toString();
  const endpoint = `/api/team-lead/weekly-report-status${queryString ? `?${queryString}` : ''}`;

  return authFetch<WeeklyReportStatusResponse>(endpoint);
}

export interface WeeklyReportHistoryEntry {
  weekNumber: number;
  year: number;
  weekStartDate: string;
  weekEndDate: string;
  submittedCount: number;
  status: string | null;
  teamReportUrl: string | null;
  lastSubmittedAt: string | null;
}

export interface WeeklyReportHistoryResponse {
  teamLeadId: string;
  year?: number | null;
  totalWeeks: number;
  reports: WeeklyReportHistoryEntry[];
}

export async function getWeeklyReportHistory(
  year?: number
): Promise<WeeklyReportHistoryResponse> {
  const params = new URLSearchParams();
  if (year) params.set('year', year.toString());
  const endpoint = `/api/team-lead/weekly-reports/history${params.toString() ? `?${params.toString()}` : ''}`;
  return authFetch<WeeklyReportHistoryResponse>(endpoint);
}

export interface WeeklyReportDetail {
  id: number;
  employeeId: string;
  employeeName: string | null;
  department: string | null;
  weekNumber: number;
  year: number;
  weekStartDate: string | null;
  weekEndDate: string | null;
  technicalScore: number | null;
  behavioralScore: number | null;
  cultureFitScore: number | null;
  growthLearningScore: number | null;
  technicalPct: number | null;
  behavioralPct: number | null;
  cultureFitPct: number | null;
  growthLearningPct: number | null;
  weeklyAura: number | null;
  grade: string | null;
  technicalNotes: string | null;
  behavioralNotes: string | null;
  cultureFitNotes: string | null;
  growthLearningNotes: string | null;
  weeklyHighlights: string | null;
  areasForFocus: string | null;
  reviewerName: string | null;
  createdAt: string | null;
  teamReportUrl: string | null;
}

export interface WeeklyReportDetailsResponse {
  teamLeadId: string;
  weekNumber: number;
  year: number;
  count: number;
  reports: WeeklyReportDetail[];
}

export async function getWeeklyReportDetails(
  week: number,
  year: number
): Promise<WeeklyReportDetailsResponse> {
  const params = new URLSearchParams();
  params.set('week', week.toString());
  params.set('year', year.toString());
  return authFetch<WeeklyReportDetailsResponse>(
    `/api/team-lead/weekly-reports?${params.toString()}`
  );
}

// ================================
// Peer Feedback Status
// ================================

export interface AggregatedScores {
  overall: number;
  support: number;
  collaboration: number;
  adaptability: number;
  values: number;
  accountability: number;
  feedback_openness: number;
}

export interface PeerFeedbackMemberStatus {
  id: string;
  full_name: string;
  job_title: string | null;
  department: string;
  avatar_url: string | null;
  has_submitted_feedback: boolean;
  feedback_received_count: number;
  aggregated_scores?: AggregatedScores;
}

export interface PeerFeedbackStatusResponse {
  team_lead_id: string;
  week: number;
  year: number;
  team_size: number;
  submitted_count: number;
  pending_count: number;
  completion_rate: number;
  members: PeerFeedbackMemberStatus[];
}

export async function getPeerFeedbackStatus(
  week?: number,
  year?: number
): Promise<PeerFeedbackStatusResponse> {
  const params = new URLSearchParams();
  if (week) params.set('week', week.toString());
  if (year) params.set('year', year.toString());

  const queryString = params.toString();
  const endpoint = `/api/team-lead/peer-feedback-status${queryString ? `?${queryString}` : ''}`;

  return authFetch<PeerFeedbackStatusResponse>(endpoint);
}

// ================================
// Tasks (using existing endpoints)
// ================================

export interface TaskProfileSummary {
  id?: string;
  full_name?: string | null;
  department?: string | null;
  gender?: string | null;
  email?: string | null;
  employee_id?: string | null;
  avatar_url?: string | null;
}

export interface TaskAssigneeSummary extends TaskProfileSummary {
  role?: string | null;
}

export interface TaskSubtask {
  id: number;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: number;
  file_name: string;
  file_size: string;
  file_type: string;
  file_url: string;
}

export interface TaskComment {
  id: number;
  content: string;
  created_at: string;
  author?: TaskProfileSummary | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string;
  assignee_name: string | null;
  assignee?: TaskProfileSummary | null;
  assignees?: TaskAssigneeSummary[] | null;
  priority: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED' | string;
  due_date: string | null;
  due_time?: string | null;
  created_at: string;
  updated_at?: string | null;
  organization?: string | null;
  tags?: string[];
  progress?: number;
  subtasks?: TaskSubtask[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  recurring_template_id?: string | null;
  is_recurring_instance?: boolean | null;
}

function normalizeTaskStatus(status?: string | null): string {
  const normalized = (status || '').trim().toUpperCase();
  switch (normalized) {
    case 'DONE':
    case 'COMPLETED':
      return 'DONE';
    case 'IN_PROGRESS':
    case 'IN PROGRESS':
      return 'IN_PROGRESS';
    case 'REVIEW':
      return 'REVIEW';
    case 'CANCELLED':
    case 'CANCELED':
      return 'CANCELLED';
    case 'TODO':
    case 'PENDING':
    default:
      return 'TODO';
  }
}

export async function getTeamTasks(): Promise<Task[]> {
  const data = await authFetch<unknown>('/tasks');
  const items = Array.isArray(data)
    ? data
    : (data as { items?: Task[] })?.items || [];
  return items.map((task) => ({
    ...task,
    status: normalizeTaskStatus((task as Task).status),
  })) as Task[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigneeId: string;
  assigneeIds?: string[];
  organization: string; // Department - required for team filtering
  priority: string;
  dueDate?: string;
  dueTime?: string; // HH:mm format
  tags?: string[];
  subtasks?: Array<{ title: string }>;
  attachments?: Array<{
    name: string;
    size: string;
    type: string;
    url: string;
    path?: string;
  }>;
  recurringTemplateId?: string;
  isRecurringInstance?: boolean;
}

export async function createTask(task: CreateTaskRequest): Promise<Task> {
  return authFetch<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<Task> {
  const normalizedStatus = normalizeTaskStatus(status);
  const progressMap: Record<string, number> = {
    TODO: 0,
    IN_PROGRESS: 50,
    REVIEW: 80,
    DONE: 100,
    CANCELLED: 0,
  };
  const progress = progressMap[normalizedStatus] ?? 0;
  return authFetch<Task>(`/tasks/${taskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: normalizedStatus, progress }),
  });
}

export async function updateTask(
  taskId: string,
  updates: Partial<CreateTaskRequest>
): Promise<Task> {
  return authFetch<Task>(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function updateTaskDescription(
  taskId: string,
  description: string
): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/tasks/${taskId}/description`, {
    method: 'PATCH',
    body: JSON.stringify({ description }),
  });
}

export async function updateSubtaskStatus(
  subtaskId: number,
  completed: boolean
): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/tasks/subtasks/${subtaskId}`, {
    method: 'PATCH',
    body: JSON.stringify({ completed }),
  });
}

export async function createTaskComment(
  taskId: string,
  content: string
): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function deleteTask(
  taskId: string
): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export interface RecurringTaskTemplateRequest {
  title: string;
  description?: string;
  defaultPriority?: string;
  defaultAssigneeId?: string;
  organization?: string;
  tags?: string[];
  recurrencePattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  recurrenceDay?: number;
  recurrenceDays?: number[];
  dueTime?: string;
  daysUntilDue?: number;
  nextOccurrence?: string;
}

export async function createRecurringTaskTemplate(
  request: RecurringTaskTemplateRequest
): Promise<{ id: string }> {
  return authFetch<{ id: string }>('/tasks/recurring', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ================================
// Task Quality Rating
// ================================

export interface PendingRating {
  id: number;
  title: string;
  assigneeId: string;
  assigneeName: string;
  completedAt: string;
}

export interface RateTaskRequest {
  rating: number; // 1-5
  comment?: string;
}

export async function getTasksPendingRating(): Promise<{
  pendingRatings: PendingRating[];
  count: number;
}> {
  return authFetch('/tasks/rating/pending');
}

export async function rateTask(
  taskId: number,
  data: RateTaskRequest
): Promise<{
  success: boolean;
  message: string;
  taskId: number;
  rating: number;
}> {
  return authFetch(`/tasks/${taskId}/rate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAverageRating(employeeId: string): Promise<{
  employeeId: string;
  averageRating: number | null;
  hasRatings: boolean;
}> {
  return authFetch(`/tasks/rating/average/${employeeId}`);
}

// ================================
// Announcements (using existing endpoints)
// ================================

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string | null;
  created_at: string;
  category: string | null;
  audience: string | null;
  status: 'Published' | 'Draft' | 'Scheduled';
  scheduled_at: string | null;
  is_pinned: boolean;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return authFetch<Announcement[]>('/announcements');
}

export async function getTeamAnnouncements(
  department: string
): Promise<Announcement[]> {
  const all = await getAnnouncements();
  // Filter to show announcements for this team or all staff
  return all.filter(
    (a) =>
      !a.audience ||
      a.audience === 'All Staff' ||
      a.audience.toLowerCase() === department.toLowerCase()
  );
}

// ================================
// Weekly Reports Submission
// ================================

export interface WeeklyReportRequest {
  employeeId: string;
  weekNumber: number;
  year: number;
  technicalScore: number;
  behavioralScore: number;
  cultureFitScore: number;
  growthLearningScore: number;
  technicalNotes?: string;
  weeklyHighlights?: string;
  areasForFocus?: string;
}

export async function submitWeeklyReport(
  report: WeeklyReportRequest
): Promise<{ success: boolean; message: string }> {
  return authFetch<{ success: boolean; message: string }>(
    '/api/performance/weekly',
    {
      method: 'POST',
      body: JSON.stringify(report),
    }
  );
}

// Simplified batch report request - only soft skills now
// Technical metrics are auto-calculated from tasks, attendance, compliance, training
export interface SimplifiedBatchReportRequest {
  weekNumber: number;
  year: number;
  teamReportUrl?: string;
  ratings: {
    employeeId: string;
    // Simplified: only soft skills that can't be auto-calculated
    // These map to existing backend fields
    initiativeScore: number; // Maps to initiative_score in DB
    attitudeTowardsWorkScore: number; // Maps to attitude_towards_work_score in DB
    teamworkCollaborationScore: number; // Maps to teamwork_collaboration_score in DB
    weeklyHighlights?: string;
    areasForFocus?: string;
    notes?: string;
  }[];
}

export async function submitSimplifiedWeeklyReports(
  batch: SimplifiedBatchReportRequest
): Promise<{ success: boolean; message: string }> {
  return authFetch<{ success: boolean; message: string }>(
    '/api/performance/weekly/simplified',
    {
      method: 'POST',
      body: JSON.stringify(batch),
    }
  );
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  category?: string;
  audience?: string;
  status?: 'Published' | 'Draft' | 'Scheduled';
  scheduledAt?: string | null;
  pinned?: boolean;
}

export async function createAnnouncement(
  announcement: CreateAnnouncementRequest
): Promise<Announcement> {
  return authFetch<Announcement>('/announcements', {
    method: 'POST',
    body: JSON.stringify(announcement),
  });
}

export async function updateAnnouncement(
  id: string,
  updates: Partial<CreateAnnouncementRequest>
): Promise<Announcement> {
  return authFetch<Announcement>(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteAnnouncement(
  id: string
): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(`/announcements/${id}`, {
    method: 'DELETE',
  });
}

export interface AnnouncementReader {
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  department?: string | null;
  role?: string | null;
  is_team_lead?: boolean | null;
  read_at?: string | null;
}

export async function getAnnouncementReaders(
  id: string
): Promise<AnnouncementReader[]> {
  return authFetch<AnnouncementReader[]>(`/announcements/${id}/reads`);
}

export async function getDepartments(): Promise<string[]> {
  return authFetch<string[]>('/departments');
}

// ================================
// Peer Feedback
// ================================

export interface PeerFeedbackRequest {
  toEmployeeId: string;
  quarter: string;
  year: number;
  supportRating: number;
  collaborationRating?: number;
  communicationRating?: number;
  adaptabilityRating?: number;
  valuesRating?: number;
  accountabilityRating?: number;
  feedbackRating?: number;
  // For rating team leads
  orgGuidanceRating?: number;
  peopleCultureRating?: number;
  influenceRating?: number;
  strengths?: string;
  areasForImprovement?: string;
  isAnonymous?: boolean;
}

export interface PeerFeedbackResponse {
  id: number;
  fromEmployeeId: string;
  toEmployeeId: string;
  quarter: string;
  year: number;
  supportRating: number;
  strengths: string | null;
  areasForImprovement: string | null;
  createdAt: string;
}

export async function submitPeerFeedback(
  feedback: PeerFeedbackRequest
): Promise<PeerFeedbackResponse> {
  return authFetch<PeerFeedbackResponse>('/api/performance/peer-feedback', {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

export async function getMyPeerFeedbackStatus(): Promise<{
  quarter: string;
  year: number;
  submittedCount: number;
  pendingCount: number;
  teamMembers: { id: string; name: string; submitted: boolean }[];
}> {
  return authFetch('/api/performance/peer-feedback/status');
}

export async function getPeerFeedbackForMe(): Promise<{
  averages: {
    supportRating: number;
    collaborationRating: number;
    adaptabilityRating: number;
    overallRating: number;
  };
  feedbackCount: number;
  strengths: string[];
  areasForImprovement: string[];
}> {
  return authFetch('/api/performance/peer-feedback/received');
}

// ================================
// Enhanced Aura with Sub-Metrics
// ================================

export interface SubMetricDetail {
  key: string;
  displayName: string;
  score: number;
  source: string;
  weightInPillar: number;
  contribution: number;
}

export interface AutoPillarDetail {
  name: string;
  weight: number;
  score: number;
  contribution: number;
  dataSource: string;
  autoCalculatedCount?: number;
  manualRatingCount?: number;
  subMetrics: SubMetricDetail[];
}

export interface AutoAuraResponse {
  employeeId: string;
  employeeName: string;
  department: string;
  departmentProfile: string; // e.g., "Engineering", "Sales"
  auraScore: number;
  grade: string;
  qgpa: number;
  quarterStart: string;
  automationRate: number; // e.g., 80 for 80%
  calculatedAt: string;
  pillars: Record<string, AutoPillarDetail>;
}

export interface DepartmentKpi {
  key: string;
  name: string;
  automationRate: number;
  totalMetrics: number;
  autoMetrics: number;
}

export interface DepartmentKpisResponse {
  departments: DepartmentKpi[];
  message: string;
}

// Get auto-calculated Aura with department-specific KPIs
export async function getMyAutoAura(): Promise<AutoAuraResponse> {
  return authFetch<AutoAuraResponse>('/api/performance/my-aura/auto');
}

// Get auto-calculated Aura for a specific employee
export async function getEmployeeAutoAura(
  employeeId: string
): Promise<AutoAuraResponse> {
  return authFetch<AutoAuraResponse>(
    `/api/performance/employee/${employeeId}/aura/auto`
  );
}

// Get available department KPI profiles
export async function getDepartmentKpis(): Promise<DepartmentKpisResponse> {
  return authFetch<DepartmentKpisResponse>('/api/performance/department-kpis');
}

// Trigger auto-recalculation for all employees
export async function triggerAutoRecalculation(): Promise<{
  message: string;
  note: string;
}> {
  return authFetch<{ message: string; note: string }>(
    '/api/performance/auto-recalculate',
    {
      method: 'POST',
    }
  );
}

// ==================== TEAM KPIs ====================

export interface TeamKpi {
  id: string;
  teamLeadId: string;
  department: string;
  name: string;
  description: string;
  targetValue: number;
  targetUnit: string;
  weight: number;
  quarter: string;
  year: number;
  isActive: boolean;
  version?: number;
  progressSource?: string | null;
  progressConfig?: Record<string, unknown> | null;
  autoProgressEnabled?: boolean;
  lastProgressSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KpiCreateRequest {
  name: string;
  description?: string;
  targetValue: number;
  targetUnit: string;
  weight: number;
  quarter: string;
  year: number;
  progressSource?: string | null;
  progressConfig?: Record<string, unknown> | null;
  autoProgressEnabled?: boolean;
}

export interface KpiUpdateRequest {
  name?: string;
  description?: string;
  targetValue?: number;
  targetUnit?: string;
  weight?: number;
  isActive?: boolean;
  progressSource?: string | null;
  progressConfig?: Record<string, unknown> | null;
  autoProgressEnabled?: boolean;
}

export interface KpiProgressItem {
  kpiId: string;
  achievedValue: number;
  notes?: string;
}

export interface WeeklyProgressRequest {
  weekNumber?: number;
  year?: number;
  progress: KpiProgressItem[];
}

export interface WeeklyKpiProgress {
  id: string;
  kpiId: string;
  reportedBy: string;
  weekNumber: number;
  year: number;
  achievedValue: number;
  progressPercentage: number;
  notes: string;
  createdAt: string;
}

export interface AiInsight {
  id: string;
  weekNumber: number;
  quarter: string;
  year: number;
  kpiScore: number;
  summary: string;
  scoreBreakdown?: {
    kpiProgressScore?: number;
    aiScore?: number;
    finalScore?: number;
    reportAvailable?: boolean;
    scoreSource?: string;
    scoreScale?: string;
  };
  rawAiResponse?: Record<string, unknown> | null;
  insights: {
    topPerforming?: string[];
    needsAttention?: string[];
    achievements?: string[];
    challenges?: string[];
  };
  recommendations: {
    items?: string[];
    nextQuarterFocus?: string[];
  };
  riskAlerts: {
    items?: string[];
  };
  generatedAt: string;
  department: string;
  promptVersion?: string;
  modelUsed?: string;
  aiRequestId?: string;
  aiJobId?: string;
  generationStatus?: string;
}

export interface TeamQuarterlyScore {
  id: string;
  teamName: string;
  department: string;
  quarter: string;
  year: number;
  kpiAchievementScore: number;
  individualAvgScore?: number;
  overallTeamScore: number;
  grade: string;
  aiSummary: string;
  scoreBreakdown?: Record<string, unknown> | null;
  createdAt?: string;
}

// Get my KPIs
export async function getMyKpis(
  quarter?: string,
  year?: number
): Promise<{
  kpis: TeamKpi[];
  quarter: string;
  year: number;
  totalWeight: number;
  remainingWeight: number;
}> {
  const params = new URLSearchParams();
  if (quarter) params.set('quarter', quarter);
  if (year) params.set('year', year.toString());
  return authFetch(`/api/kpi/my-kpis?${params.toString()}`);
}

// Create a KPI
export async function createKpi(
  data: KpiCreateRequest
): Promise<{ success: boolean; message: string; kpi: TeamKpi }> {
  return authFetch('/api/kpi', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Update a KPI
export async function updateKpi(
  kpiId: string,
  data: KpiUpdateRequest
): Promise<{ success: boolean; message: string; kpi: TeamKpi }> {
  return authFetch(`/api/kpi/${kpiId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Delete a KPI
export async function deleteKpi(
  kpiId: string
): Promise<{ success: boolean; message: string }> {
  return authFetch(`/api/kpi/${kpiId}`, {
    method: 'DELETE',
  });
}

// Submit weekly progress
export async function submitKpiProgress(data: WeeklyProgressRequest): Promise<{
  success: boolean;
  message: string;
  weekNumber: number;
  progress: WeeklyKpiProgress[];
}> {
  return authFetch('/api/kpi/progress', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Get weekly progress
export async function getKpiProgress(
  weekNumber?: number,
  year?: number
): Promise<{
  weekNumber: number;
  year: number;
  progress: WeeklyKpiProgress[];
}> {
  const params = new URLSearchParams();
  if (weekNumber) params.set('weekNumber', weekNumber.toString());
  if (year) params.set('year', year.toString());
  return authFetch(`/api/kpi/progress?${params.toString()}`);
}

// Generate AI insight
export interface AiInsightGenerateResponse {
  success: boolean;
  message?: string;
  jobId?: string;
  insight?: AiInsight;
  weekNumber?: number;
  year?: number;
}

export async function generateAiInsight(
  weekNumber?: number,
  year?: number
): Promise<AiInsightGenerateResponse> {
  const params = new URLSearchParams();
  if (weekNumber) params.set('weekNumber', weekNumber.toString());
  if (year) params.set('year', year.toString());
  return authFetch(`/api/kpi/insights/generate?${params.toString()}`, {
    method: 'POST',
  });
}

// Get latest AI insight
export async function getLatestInsight(): Promise<
  AiInsight | { message: string; tip?: string }
> {
  return authFetch('/api/kpi/insights/latest');
}

// Get insight history
export async function getInsightHistory(): Promise<{
  insights: AiInsight[];
  total: number;
}> {
  return authFetch('/api/kpi/insights/history');
}

// Calculate team score
export async function calculateTeamScore(
  quarter?: string,
  year?: number
): Promise<{
  success: boolean;
  message: string;
  score: TeamQuarterlyScore;
}> {
  const params = new URLSearchParams();
  if (quarter) params.set('quarter', quarter);
  if (year) params.set('year', year.toString());
  return authFetch(`/api/kpi/score/calculate?${params.toString()}`, {
    method: 'POST',
  });
}

// Get my team score
export async function getMyTeamScore(
  quarter?: string,
  year?: number
): Promise<TeamQuarterlyScore | { message: string }> {
  const params = new URLSearchParams();
  if (quarter) params.set('quarter', quarter);
  if (year) params.set('year', year.toString());
  return authFetch(`/api/kpi/score/my-team?${params.toString()}`);
}

// Get all team scores (for overview)
export async function getAllTeamScores(
  quarter?: string,
  year?: number
): Promise<{
  quarter: string;
  year: number;
  teams: TeamQuarterlyScore[];
  totalTeams: number;
  averageScore: number;
}> {
  const params = new URLSearchParams();
  if (quarter) params.set('quarter', quarter);
  if (year) params.set('year', year.toString());
  return authFetch(`/api/kpi/score/all-teams?${params.toString()}`);
}

// ==================== PERSONAL INSIGHTS ====================

export interface PersonalPerformanceData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  onTimeTasks: number;
  onTimeRate: number;
  avgQualityRating: number;
  ratedTasks: number;
  avgResponseDays: number;
  attendanceDays: number;
  onTimeCheckIns: number;
  punctualityRate: number;
  certificatesThisQuarter: number;
  strengths: string[];
  improvements: string[];
  department: string;
  employeeName: string;
}

export interface PersonalAiInsights {
  overallAssessment: string;
  performanceScore: number;
  keyStrengths: string[];
  improvementAreas: string[];
  actionableRecommendations: string[];
  skillsToFocus: string[];
  motivationalMessage: string;
}

export interface PersonalInsightsResponse {
  employeeId: string;
  employeeName: string;
  department: string;
  generatedAt: string;
  performanceData: PersonalPerformanceData;
  aiInsights: PersonalAiInsights;
  aiError?: string;
}

// Get personal insights for a specific employee
export async function getEmployeeInsights(
  employeeId: string
): Promise<PersonalInsightsResponse> {
  return authFetch(`/api/kpi/insights/employee/${employeeId}`);
}

// Get team insight for department
export async function getTeamInsight(): Promise<
  AiInsight | { message: string }
> {
  return authFetch('/api/kpi/insights/team');
}

// ==================== AI JOB STATUS ====================

export interface AiJobStatus {
  id: string;
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'DEAD' | string;
  attempts: number | null;
  maxAttempts: number | null;
  nextRunAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAiJobStatus(jobId: string): Promise<AiJobStatus> {
  return authFetch(`/api/ai/jobs/${jobId}`);
}

// ================================
// Individual KPIs
// ================================

export interface IndividualKpi {
  id: string;
  employeeId: string;
  setById: string;
  department: string | null;
  name: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  targetUnit: string | null;
  weight: number;
  quarter: string;
  year: number;
  isActive: boolean;
  version?: number;
  progressSource?: string | null;
  progressConfig?: Record<string, unknown> | null;
  autoProgressEnabled?: boolean;
  lastProgressSyncAt?: string | null;
  achievementPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeKpis {
  employeeId: string;
  employeeName: string;
  employeeEmail: string | null;
  employeeRole: string | null;
  avatar_url?: string | null;
  gender?: string | null;
  kpis: IndividualKpi[];
  totalWeight: number;
  isComplete: boolean;
}

export interface TeamKpisResponse {
  quarter: string;
  year: number;
  employees: EmployeeKpis[];
}

export interface PendingSetupResponse {
  quarter: string;
  year: number;
  pendingCount: number;
  employees: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  }[];
}

export interface CreateIndividualKpiRequest {
  employeeId: string;
  name: string;
  description?: string;
  targetValue: number;
  targetUnit?: string;
  weight: number;
  quarter?: string;
  year?: number;
  progressSource?: string | null;
  progressConfig?: Record<string, unknown> | null;
  autoProgressEnabled?: boolean;
}

export interface UpdateIndividualKpiRequest {
  name?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  targetUnit?: string;
  weight?: number;
  isActive?: boolean;
  progressSource?: string | null;
  progressConfig?: Record<string, unknown> | null;
  autoProgressEnabled?: boolean;
}

// Get all individual KPIs set by this team lead for their team
export async function getTeamIndividualKpis(
  quarter?: string,
  year?: number
): Promise<TeamKpisResponse> {
  const params = new URLSearchParams();
  if (quarter) params.append('quarter', quarter);
  if (year) params.append('year', year.toString());
  const queryString = params.toString();
  return authFetch(
    `/api/individual-kpis/my-team${queryString ? `?${queryString}` : ''}`
  );
}

// Get team members who don't have KPIs set yet
export async function getPendingKpiSetup(
  quarter?: string,
  year?: number
): Promise<PendingSetupResponse> {
  const params = new URLSearchParams();
  if (quarter) params.append('quarter', quarter);
  if (year) params.append('year', year.toString());
  const queryString = params.toString();
  return authFetch(
    `/api/individual-kpis/pending-setup${queryString ? `?${queryString}` : ''}`
  );
}

// Create an individual KPI for a team member
export async function createIndividualKpi(
  data: CreateIndividualKpiRequest
): Promise<{ success: boolean; message: string; kpi: IndividualKpi }> {
  return authFetch('/api/individual-kpis', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Update an individual KPI
export async function updateIndividualKpi(
  kpiId: string,
  data: UpdateIndividualKpiRequest
): Promise<{ success: boolean; message: string; kpi: IndividualKpi }> {
  return authFetch(`/api/individual-kpis/${kpiId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Delete an individual KPI
export async function deleteIndividualKpi(
  kpiId: string
): Promise<{ success: boolean; message: string }> {
  return authFetch(`/api/individual-kpis/${kpiId}`, {
    method: 'DELETE',
  });
}

// ================================
// Daily Reports (Team Lead)
// ================================

export interface DailyReport {
  id: number;
  employeeId: string;
  reportDate: string;
  tasksCompleted: string;
  tasksInProgress: string | null;
  blockers: string | null;
  plannedForTomorrow: string | null;
  additionalNotes: string | null;
  aiScore: number | null;
  aiFeedback: string | null;
  aiSuggestions: string | null; // JSON array of AI-generated suggestions for tomorrow
  aiStrengths: string | null; // JSON array of AI-identified strengths
  aiImprovements: string | null; // JSON array of AI-identified improvement areas
  aiAuraBoostTips: string | null; // JSON array of AI tips to boost Aura score
  aiGradedAt: string | null;
  kpiAlignmentScore: number | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  reviewerScore: number | null;
  finalScore: number | null;
  createdAt: string;
}

export interface EmployeeDailyReports {
  employeeId: string;
  employeeName: string;
  reports: DailyReport[];
}

// Get team's daily reports
export async function getTeamDailyReports(
  date?: string,
  days?: number
): Promise<EmployeeDailyReports[]> {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (days) params.append('days', days.toString());
  const queryString = params.toString();
  return authFetch(
    `/api/daily-reports/team${queryString ? `?${queryString}` : ''}`
  );
}

// Review a daily report
export async function reviewDailyReport(
  reportId: number,
  notes: string,
  score?: number
): Promise<{ success: boolean; message: string; report: DailyReport }> {
  return authFetch(`/api/daily-reports/${reportId}/review`, {
    method: 'POST',
    body: JSON.stringify({ notes, score }),
  });
}

// Get daily report submission stats for team
export async function getTeamDailyReportStats(date?: string): Promise<{
  date: string;
  totalMembers: number;
  submittedCount: number;
  pendingCount: number;
  averageAiScore: number | null;
  members: {
    employeeId: string;
    employeeName: string;
    hasSubmitted: boolean;
    aiScore: number | null;
    status: string | null;
  }[];
}> {
  const params = date ? `?date=${date}` : '';
  return authFetch(`/api/daily-reports/team/stats${params}`);
}

// ================================
// User Preferences
// ================================

export interface UserPreferences {
  userId?: string | null;
  emailNotifications: boolean | null;
  pushNotifications: boolean | null;
  marketingNotifications: boolean | null;
  securityAlerts: boolean | null;
  theme: 'light' | 'dark' | 'system' | null;
  updatedAt?: string | null;
}

export async function getUserPreferences(): Promise<UserPreferences> {
  return authFetch('/api/settings/preferences');
}

export async function updateUserPreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences> {
  return authFetch('/api/settings/preferences', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}
