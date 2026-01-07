'use server';

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://schoolable-backend.onrender.com';

/**
 * Make an authenticated API request to the backend
 */
async function authFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cookieStore = await cookies();
    const token = cookieStore.get('teamlead-auth-token')?.value;

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || error.error || 'Request failed');
    }

    return response.json();
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

export async function getTeamMembers(includeSelf: boolean = true): Promise<TeamMembersResponse> {
    return authFetch<TeamMembersResponse>(`/api/team-lead/team-members?includeSelf=${includeSelf}`);
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

// ================================
// Tasks (using existing endpoints)
// ================================

export interface Task {
    id: string;
    title: string;
    description: string | null;
    assignee_id: string;
    assignee_name: string | null;
    priority: string;
    status: string;
    due_date: string | null;
    created_at: string;
    category: string | null;
}

export async function getTeamTasks(): Promise<Task[]> {
    return authFetch<Task[]>('/tasks/team');
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    assigneeId: string;
    organization: string; // Department - required for team filtering
    priority: string;
    dueDate?: string;
    dueTime?: string; // HH:mm format
    tags?: string[];
}

export async function createTask(task: CreateTaskRequest): Promise<Task> {
    return authFetch<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
    });
}

export async function updateTaskStatus(taskId: string, status: string): Promise<Task> {
    return authFetch<Task>(`/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
}

export async function updateTask(taskId: string, updates: Partial<CreateTaskRequest>): Promise<Task> {
    return authFetch<Task>(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteTask(taskId: string): Promise<{ success: boolean }> {
    return authFetch<{ success: boolean }>(`/tasks/${taskId}`, {
        method: 'DELETE',
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

export async function getTasksPendingRating(): Promise<{ pendingRatings: PendingRating[]; count: number }> {
    return authFetch('/tasks/rating/pending');
}

export async function rateTask(taskId: number, data: RateTaskRequest): Promise<{ success: boolean; message: string; taskId: number; rating: number }> {
    return authFetch(`/tasks/${taskId}/rate`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function getAverageRating(employeeId: string): Promise<{ employeeId: string; averageRating: number | null; hasRatings: boolean }> {
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

export async function getTeamAnnouncements(department: string): Promise<Announcement[]> {
    const all = await getAnnouncements();
    // Filter to show announcements for this team or all staff
    return all.filter(a =>
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

export async function submitWeeklyReport(report: WeeklyReportRequest): Promise<{ success: boolean; message: string }> {
    return authFetch<{ success: boolean; message: string }>('/api/performance/weekly', {
        method: 'POST',
        body: JSON.stringify(report),
    });
}

// Simplified batch report request - only soft skills now
// Technical metrics are auto-calculated from tasks, attendance, compliance, training
export interface BatchReportRequest {
    weekNumber: number;
    year: number;
    reports: {
        employeeId: string;
        // Simplified: only soft skills that can't be auto-calculated
        // These map to existing backend fields
        initiativeScore: number;              // Maps to initiative_score in DB
        attitudeTowardsWorkScore: number;     // Maps to attitude_towards_work_score in DB  
        teamworkCollaborationScore: number;   // Maps to teamwork_collaboration_score in DB
        weeklyHighlights?: string;
        areasForFocus?: string;
    }[];
}

export async function submitBatchWeeklyReports(batch: BatchReportRequest): Promise<{ success: boolean; message: string }> {
    return authFetch<{ success: boolean; message: string }>('/api/performance/weekly/batch', {
        method: 'POST',
        body: JSON.stringify(batch),
    });
}

export interface CreateAnnouncementRequest {
    title: string;
    content: string;
    category?: string;
    audience?: string;
    status?: 'Published' | 'Draft' | 'Scheduled';
    scheduled_at?: string | null;
    is_pinned?: boolean;
}

export async function createAnnouncement(announcement: CreateAnnouncementRequest): Promise<Announcement> {
    return authFetch<Announcement>('/announcements', {
        method: 'POST',
        body: JSON.stringify(announcement),
    });
}

export async function updateAnnouncement(id: string, updates: Partial<CreateAnnouncementRequest>): Promise<Announcement> {
    return authFetch<Announcement>(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    return authFetch<{ success: boolean }>(`/announcements/${id}`, {
        method: 'DELETE',
    });
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

export async function submitPeerFeedback(feedback: PeerFeedbackRequest): Promise<PeerFeedbackResponse> {
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
export async function getEmployeeAutoAura(employeeId: string): Promise<AutoAuraResponse> {
    return authFetch<AutoAuraResponse>(`/api/performance/employee/${employeeId}/aura/auto`);
}

// Get available department KPI profiles
export async function getDepartmentKpis(): Promise<DepartmentKpisResponse> {
    return authFetch<DepartmentKpisResponse>('/api/performance/department-kpis');
}

// Trigger auto-recalculation for all employees
export async function triggerAutoRecalculation(): Promise<{ message: string; note: string }> {
    return authFetch<{ message: string; note: string }>('/api/performance/auto-recalculate', {
        method: 'POST',
    });
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
}

export interface KpiUpdateRequest {
    name?: string;
    description?: string;
    targetValue?: number;
    targetUnit?: string;
    weight?: number;
    isActive?: boolean;
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
}

export interface TeamQuarterlyScore {
    id: string;
    teamName: string;
    department: string;
    quarter: string;
    year: number;
    kpiAchievementScore: number;
    overallTeamScore: number;
    grade: string;
    aiSummary: string;
}

// Get my KPIs
export async function getMyKpis(quarter?: string, year?: number): Promise<{
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
export async function createKpi(data: KpiCreateRequest): Promise<{ success: boolean; message: string; kpi: TeamKpi }> {
    return authFetch('/api/kpi', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Update a KPI
export async function updateKpi(kpiId: string, data: KpiUpdateRequest): Promise<{ success: boolean; message: string; kpi: TeamKpi }> {
    return authFetch(`/api/kpi/${kpiId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// Delete a KPI
export async function deleteKpi(kpiId: string): Promise<{ success: boolean; message: string }> {
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
export async function getKpiProgress(weekNumber?: number, year?: number): Promise<{
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
export async function generateAiInsight(weekNumber?: number, year?: number): Promise<{
    success: boolean;
    message: string;
    insight: AiInsight;
}> {
    const params = new URLSearchParams();
    if (weekNumber) params.set('weekNumber', weekNumber.toString());
    if (year) params.set('year', year.toString());
    return authFetch(`/api/kpi/insights/generate?${params.toString()}`, {
        method: 'POST',
    });
}

// Get latest AI insight
export async function getLatestInsight(): Promise<AiInsight | { message: string; tip?: string }> {
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
export async function calculateTeamScore(quarter?: string, year?: number): Promise<{
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
export async function getMyTeamScore(quarter?: string, year?: number): Promise<TeamQuarterlyScore | { message: string }> {
    const params = new URLSearchParams();
    if (quarter) params.set('quarter', quarter);
    if (year) params.set('year', year.toString());
    return authFetch(`/api/kpi/score/my-team?${params.toString()}`);
}

// Get all team scores (for overview)
export async function getAllTeamScores(quarter?: string, year?: number): Promise<{
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
export async function getEmployeeInsights(employeeId: string): Promise<PersonalInsightsResponse> {
    return authFetch(`/api/kpi/insights/employee/${employeeId}`);
}

// Get team insight for department
export async function getTeamInsight(): Promise<AiInsight | { message: string }> {
    return authFetch('/api/kpi/insights/team');
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
    achievementPercentage: number;
    createdAt: string;
    updatedAt: string;
}

export interface EmployeeKpis {
    employeeId: string;
    employeeName: string;
    employeeEmail: string | null;
    employeeRole: string | null;
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
}

export interface UpdateIndividualKpiRequest {
    name?: string;
    description?: string;
    targetValue?: number;
    currentValue?: number;
    targetUnit?: string;
    weight?: number;
    isActive?: boolean;
}

// Get all individual KPIs set by this team lead for their team
export async function getTeamIndividualKpis(quarter?: string, year?: number): Promise<TeamKpisResponse> {
    const params = new URLSearchParams();
    if (quarter) params.append('quarter', quarter);
    if (year) params.append('year', year.toString());
    const queryString = params.toString();
    return authFetch(`/api/individual-kpis/my-team${queryString ? `?${queryString}` : ''}`);
}

// Get team members who don't have KPIs set yet
export async function getPendingKpiSetup(quarter?: string, year?: number): Promise<PendingSetupResponse> {
    const params = new URLSearchParams();
    if (quarter) params.append('quarter', quarter);
    if (year) params.append('year', year.toString());
    const queryString = params.toString();
    return authFetch(`/api/individual-kpis/pending-setup${queryString ? `?${queryString}` : ''}`);
}

// Create an individual KPI for a team member
export async function createIndividualKpi(data: CreateIndividualKpiRequest): Promise<{ success: boolean; message: string; kpi: IndividualKpi }> {
    return authFetch('/api/individual-kpis', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Update an individual KPI
export async function updateIndividualKpi(kpiId: string, data: UpdateIndividualKpiRequest): Promise<{ success: boolean; message: string; kpi: IndividualKpi }> {
    return authFetch(`/api/individual-kpis/${kpiId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

// Delete an individual KPI
export async function deleteIndividualKpi(kpiId: string): Promise<{ success: boolean; message: string }> {
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
export async function getTeamDailyReports(date?: string, days?: number): Promise<EmployeeDailyReports[]> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (days) params.append('days', days.toString());
    const queryString = params.toString();
    return authFetch(`/api/daily-reports/team${queryString ? `?${queryString}` : ''}`);
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
