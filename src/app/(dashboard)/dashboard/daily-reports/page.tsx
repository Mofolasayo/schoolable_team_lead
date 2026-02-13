'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, getInitials } from '@/lib/avatar';
import {
  getTeamDailyReports,
  getTeamMembers,
  reviewDailyReport,
  type DailyReport,
  type EmployeeDailyReports,
  type TeamMember,
} from '@/lib/api/team-lead';

type SelectedEmployee = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  department?: string | null;
  avatarUrl: string;
};

export default function DailyReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<EmployeeDailyReports[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toLocaleDateString('en-CA');
  });
  const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(
    null
  );
  const [selectedEmployee, setSelectedEmployee] =
    useState<SelectedEmployee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memberDirectory, setMemberDirectory] = useState<
    Record<string, TeamMember>
  >({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTeamDailyReports(
        selectedDate,
        viewMode === 'week' ? 7 : 1
      );
      setReports(data);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let isMounted = true;
    const loadMembers = async () => {
      try {
        const data = await getTeamMembers();
        if (!isMounted) return;
        const directory: Record<string, TeamMember> = {};
        data.members.forEach((member) => {
          directory[String(member.id)] = member;
          if (member.employee_id) {
            directory[String(member.employee_id)] = member;
          }
          if (member.email) {
            directory[member.email.toLowerCase()] = member;
          }
        });
        setMemberDirectory(directory);
      } catch (err) {
        console.error('Error loading team members:', err);
      }
    };
    loadMembers();
    return () => {
      isMounted = false;
    };
  }, []);

  const resolveEmployeeProfile = (employee: EmployeeDailyReports) => {
    const direct = memberDirectory[employee.employeeId];
    if (direct) return direct;
    return memberDirectory[String(employee.employeeId)] || null;
  };

  const resolveEmployeeMeta = (
    employee: EmployeeDailyReports
  ): SelectedEmployee => {
    const profile = resolveEmployeeProfile(employee);
    const name = profile?.full_name || employee.employeeName || 'Team member';
    const avatarUrl = getAvatarUrl({
      avatar_url: profile?.avatar_url,
      employee_id: profile?.employee_id ?? employee.employeeId,
      email: profile?.email ?? undefined,
      full_name: profile?.full_name ?? employee.employeeName,
      employeeName: employee.employeeName,
    });

    return {
      id: employee.employeeId,
      name,
      email: profile?.email ?? null,
      role: profile?.job_title ?? null,
      department: profile?.department ?? null,
      avatarUrl,
    };
  };

  // Get stats
  const totalMembers = reports.length;
  const submittedToday = reports.filter((e) =>
    e.reports.some((r) => r.reportDate === selectedDate)
  ).length;
  const pendingToday = totalMembers - submittedToday;
  const avgScore =
    reports.reduce((sum, e) => {
      const todayReport = e.reports.find((r) => r.reportDate === selectedDate);
      return sum + (todayReport?.aiScore || 0);
    }, 0) / (submittedToday || 1);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-500';
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return 'bg-muted/30';
    if (score >= 80) return 'bg-emerald-50';
    if (score >= 60) return 'bg-amber-50';
    return 'bg-rose-50';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed':
        return (
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
            Reviewed
          </span>
        );
      case 'flagged':
        return (
          <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 text-xs text-rose-700">
            Flagged
          </span>
        );
      default:
        return (
          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            Submitted
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-normal text-gray-800">Daily Reports</h1>
        <p className="text-xs text-muted-foreground">
          Review and manage your team&apos;s daily submissions
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            View
          </label>
          <div className="flex overflow-hidden rounded-lg border border-border/40">
            <button
              onClick={() => setViewMode('today')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'today'
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted-foreground hover:bg-muted/40'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-primary text-white'
                  : 'bg-white text-muted-foreground hover:bg-muted/40'
              }`}
            >
              Week
            </button>
          </div>
        </div>
        <button
          onClick={loadData}
          className="ml-auto flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {submittedToday}
              </p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {pendingToday}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {submittedToday > 0 ? Math.round(avgScore) : '--'}%
              </p>
              <p className="text-xs text-muted-foreground">Avg AI Score</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-800">
                {totalMembers}
              </p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
        <div className="border-b border-border/40 p-4">
          <h2 className="text-sm font-medium text-gray-800">Team Reports</h2>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mb-1 text-base font-medium text-gray-800">
              No reports found
            </h3>
            <p className="text-xs text-muted-foreground">
              No team members have submitted reports for this period.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {reports.map((employee) => {
              const employeeMeta = resolveEmployeeMeta(employee);
              return (
                <div key={employee.employeeId} className="p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border/40">
                      <AvatarImage src={employeeMeta.avatarUrl} />
                      <AvatarFallback className="bg-slate-100 text-xs text-slate-600">
                        {getInitials(employeeMeta.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-medium text-gray-800">
                        {employeeMeta.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {employee.reports.length} report
                        {employee.reports.length !== 1 ? 's' : ''} in this
                        period
                      </p>
                    </div>
                  </div>

                  {employee.reports.length === 0 ? (
                    <div className="ml-12 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                      No report submitted for {selectedDate}
                    </div>
                  ) : (
                    <div className="ml-12 space-y-2">
                      {employee.reports.map((report) => (
                        <div
                          key={report.id}
                          onClick={() => {
                            setSelectedReport(report);
                            setSelectedEmployee(employeeMeta);
                          }}
                          className="cursor-pointer rounded-lg border border-border/40 bg-muted/20 p-4 transition-colors hover:bg-muted/30"
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {new Date(report.reportDate).toLocaleDateString(
                                  'en-US',
                                  {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  }
                                )}
                              </span>
                              {getStatusBadge(report.status)}
                            </div>
                            {report.aiScore !== null && (
                              <div
                                className={`flex items-center gap-1 rounded-full border border-border/40 px-2 py-1 ${getScoreBg(report.aiScore)}`}
                              >
                                <svg
                                  className="h-3.5 w-3.5 text-primary"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span
                                  className={`text-sm font-bold ${getScoreColor(report.aiScore)}`}
                                >
                                  {report.aiScore.toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {report.tasksCompleted}
                          </p>
                          {report.aiFeedback && (
                            <p className="mt-2 line-clamp-1 text-xs italic text-muted-foreground">
                              AI: {report.aiFeedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && selectedEmployee && (
        <ReportDetailModal
          report={selectedReport}
          employee={selectedEmployee}
          onClose={() => {
            setSelectedReport(null);
            setSelectedEmployee(null);
          }}
          onReview={(notes, score) =>
            handleReview(selectedReport.id, notes, score)
          }
        />
      )}
    </div>
  );

  async function handleReview(reportId: number, notes: string, score?: number) {
    try {
      await reviewDailyReport(reportId, notes, score);
      setSelectedReport(null);
      setSelectedEmployee(null);
      loadData();
    } catch (err) {
      console.error('Error reviewing report:', err);
      alert('Failed to submit review');
    }
  }
}

// Report Detail Modal Component
function ReportDetailModal({
  report,
  employee,
  onClose,
  onReview,
}: {
  report: DailyReport;
  employee: SelectedEmployee;
  onClose: () => void;
  onReview: (notes: string, score?: number) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewScore, setReviewScore] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const strengths = parseJsonList(report.aiStrengths);
  const improvements = parseJsonList(report.aiImprovements);
  const auraBoostTips = parseJsonList(report.aiAuraBoostTips);
  const statusKey = report.status?.toLowerCase() || 'submitted';
  const statusLabel = statusKey.replace(/_/g, ' ');
  const statusStyles: Record<string, string> = {
    submitted: 'bg-blue-50 text-blue-700 border-blue-100',
    reviewed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    flagged: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  const statusStyle =
    statusStyles[statusKey] || 'bg-slate-50 text-slate-600 border-slate-200';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onReview(
        reviewNotes,
        reviewScore ? parseInt(reviewScore) : undefined
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border/40 bg-white p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border border-border/40">
                <AvatarImage src={employee.avatarUrl} />
                <AvatarFallback className="bg-slate-100 text-sm text-slate-600">
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {employee.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {employee.role || 'Team member'}
                  {employee.department ? ` • ${employee.department}` : ''}
                </p>
                {employee.email && (
                  <p className="text-xs text-slate-400">{employee.email}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-border/40 bg-white px-3 py-1">
              {new Date(report.reportDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span
              className={`rounded-full border px-3 py-1 font-medium capitalize ${statusStyle}`}
            >
              {statusLabel}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {report.aiScore !== null && (
              <ScoreCard
                label="AI Score"
                value={`${report.aiScore.toFixed(0)}%`}
              />
            )}
            {report.kpiAlignmentScore !== null && (
              <ScoreCard
                label="KPI Alignment"
                value={`${report.kpiAlignmentScore.toFixed(0)}%`}
              />
            )}
            {report.finalScore !== null && (
              <ScoreCard
                label="Final Score"
                value={`${report.finalScore.toFixed(0)}%`}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-6 p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Work Summary
                </h3>
                <span className="text-xs text-slate-400">Daily report</span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailCard title="Tasks Completed">
                  {report.tasksCompleted}
                </DetailCard>
                {report.tasksInProgress && (
                  <DetailCard title="Tasks In Progress">
                    {report.tasksInProgress}
                  </DetailCard>
                )}
                {report.plannedForTomorrow && (
                  <DetailCard title="Planned for Tomorrow">
                    {report.plannedForTomorrow}
                  </DetailCard>
                )}
                {report.additionalNotes && (
                  <DetailCard title="Additional Notes">
                    {report.additionalNotes}
                  </DetailCard>
                )}
                {report.blockers && (
                  <DetailCard title="Blockers" tone="danger">
                    {report.blockers}
                  </DetailCard>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                AI Insights
              </h3>
              {/* AI Feedback */}
              {report.aiFeedback && (
                <div className="rounded-xl border border-slate-200/60 bg-white p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    AI Feedback
                  </p>
                  <p className="text-sm leading-relaxed text-slate-700">
                    {report.aiFeedback}
                  </p>
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                {strengths.length > 0 && (
                  <AiListSection
                    title="Strengths"
                    items={strengths}
                    tone="success"
                  />
                )}

                {improvements.length > 0 && (
                  <AiListSection
                    title="Improvements"
                    items={improvements}
                    tone="warning"
                  />
                )}
              </div>

              {/* AI Suggestions for Tomorrow */}
              {report.aiSuggestions &&
                (() => {
                  try {
                    const suggestions = JSON.parse(report.aiSuggestions);
                    if (Array.isArray(suggestions) && suggestions.length > 0) {
                      return (
                        <div className="rounded-xl border border-slate-200/60 bg-white p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            AI Suggestions for Tomorrow
                          </p>
                          <ul className="space-y-2">
                            {suggestions.map(
                              (suggestion: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm text-slate-700"
                                >
                                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                    {index + 1}
                                  </span>
                                  <span>{suggestion}</span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      );
                    }
                  } catch {
                    return null;
                  }
                  return null;
                })()}

              {auraBoostTips.length > 0 && (
                <AiListSection
                  title="Aura Boost Tips"
                  items={auraBoostTips}
                  tone="info"
                />
              )}
            </div>

            {/* Previous Review */}
            {report.reviewedAt && (
              <div className="rounded-xl border border-slate-200/60 bg-white p-4">
                <h3 className="mb-2 text-sm font-medium text-slate-900">
                  Previous Review
                </h3>
                <p className="text-sm leading-relaxed text-slate-700">
                  {report.reviewerNotes}
                </p>
                {report.reviewerScore !== null && (
                  <p className="mt-2 text-sm text-slate-500">
                    Score: {report.reviewerScore}%
                  </p>
                )}
              </div>
            )}

            {/* Review Form */}
            {report.status !== 'reviewed' && (
              <div className="space-y-3 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-900">
                  Manager Review
                </h3>
                <div className="rounded-xl border border-slate-200/60 bg-white p-4">
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add feedback or comments..."
                    rows={3}
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">
                        Override Score (optional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={reviewScore}
                        onChange={(e) => setReviewScore(e.target.value)}
                        placeholder="0-100"
                        className="w-28 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !reviewNotes.trim()}
                      className="ml-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseJsonList(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => String(item))
        .filter((item) => item.trim().length > 0);
    }
    return [];
  } catch {
    return [];
  }
}

function AiListSection({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'success' | 'warning' | 'info';
}) {
  const toneStyles = {
    success:
      'border-slate-200/60 bg-white text-slate-700 border-l-4 border-l-emerald-400/70',
    warning:
      'border-slate-200/60 bg-white text-slate-700 border-l-4 border-l-amber-400/70',
    info: 'border-slate-200/60 bg-white text-slate-700 border-l-4 border-l-blue-400/70',
  }[tone];

  return (
    <div className={`rounded-xl border p-4 ${toneStyles}`}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}`}
            className="flex items-start gap-2 text-sm"
          >
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DetailCard({
  title,
  tone = 'default',
  children,
}: {
  title: string;
  tone?: 'default' | 'danger';
  children: ReactNode;
}) {
  const toneStyles =
    tone === 'danger'
      ? 'border-slate-200/60 bg-white text-slate-700 border-l-4 border-l-rose-400/70'
      : 'border-slate-200/60 bg-white text-slate-700 shadow-sm';

  return (
    <div className={`rounded-xl border p-4 ${toneStyles}`}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{children}</p>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
