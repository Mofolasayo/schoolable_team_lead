'use server';

import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://schoolable-backend.onrender.com';

/**
 * Make an authenticated API request to the backend
 */
async function authFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

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
    assignee_id: string;
    priority: string;
    due_date?: string;
    category?: string;
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
    is_pinned: boolean;
}

export async function getAnnouncements(): Promise<Announcement[]> {
    return authFetch<Announcement[]>('/announcements');
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

export interface BatchReportRequest {
    weekNumber: number;
    year: number;
    reports: {
        employeeId: string;
        technicalScore: number;
        behavioralScore: number;
        cultureFitScore: number;
        growthLearningScore: number;
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
