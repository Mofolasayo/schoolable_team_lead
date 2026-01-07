'use client';

import { useState, useEffect } from 'react';
import {
    getTeamDailyReports,
    reviewDailyReport,
    type DailyReport,
    type EmployeeDailyReports,
} from '@/lib/api/team-lead';

export default function DailyReportsPage() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<EmployeeDailyReports[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'today' | 'week'>('today');
    const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
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
    };

    useEffect(() => {
        loadData();
    }, [selectedDate, viewMode]);

    // Get stats
    const totalMembers = reports.length;
    const submittedToday = reports.filter(e =>
        e.reports.some(r => r.reportDate === selectedDate)
    ).length;
    const pendingToday = totalMembers - submittedToday;
    const avgScore = reports.reduce((sum, e) => {
        const todayReport = e.reports.find(r => r.reportDate === selectedDate);
        return sum + (todayReport?.aiScore || 0);
    }, 0) / (submittedToday || 1);

    const getScoreColor = (score: number | null) => {
        if (score === null) return 'text-gray-400';
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-500';
    };

    const getScoreBg = (score: number | null) => {
        if (score === null) return 'bg-gray-100';
        if (score >= 80) return 'bg-green-100';
        if (score >= 60) return 'bg-amber-100';
        return 'bg-red-100';
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'reviewed':
                return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Reviewed</span>;
            case 'flagged':
                return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Flagged</span>;
            default:
                return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Submitted</span>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
                <p className="text-gray-500 mt-1">Review and manage your team's daily submissions</p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">View</label>
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                        <button
                            onClick={() => setViewMode('today')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'today'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'week'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Week
                        </button>
                    </div>
                </div>
                <button
                    onClick={loadData}
                    className="ml-auto px-3 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
                    {error}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{submittedToday}</p>
                            <p className="text-xs text-gray-500">Submitted</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{pendingToday}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {submittedToday > 0 ? Math.round(avgScore) : '--'}%
                            </p>
                            <p className="text-xs text-gray-500">Avg AI Score</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{totalMembers}</p>
                            <p className="text-xs text-gray-500">Team Members</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Team Reports</h2>
                </div>

                {reports.length === 0 ? (
                    <div className="p-16 text-center">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                        <p className="text-gray-500">No team members have submitted reports for this period.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {reports.map((employee) => (
                            <div key={employee.employeeId} className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 font-semibold">
                                            {employee.employeeName?.charAt(0) || '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">{employee.employeeName}</h3>
                                        <p className="text-xs text-gray-500">
                                            {employee.reports.length} report{employee.reports.length !== 1 ? 's' : ''} in this period
                                        </p>
                                    </div>
                                </div>

                                {employee.reports.length === 0 ? (
                                    <div className="ml-13 py-4 px-4 bg-amber-50 rounded-lg text-amber-700 text-sm">
                                        No report submitted for {selectedDate}
                                    </div>
                                ) : (
                                    <div className="ml-13 space-y-2">
                                        {employee.reports.map((report) => (
                                            <div
                                                key={report.id}
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setSelectedEmployeeName(employee.employeeName);
                                                }}
                                                className="p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {new Date(report.reportDate).toLocaleDateString('en-US', {
                                                                weekday: 'short',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                        {getStatusBadge(report.status)}
                                                    </div>
                                                    {report.aiScore !== null && (
                                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${getScoreBg(report.aiScore)}`}>
                                                            <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                            <span className={`text-sm font-bold ${getScoreColor(report.aiScore)}`}>
                                                                {report.aiScore.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {report.tasksCompleted}
                                                </p>
                                                {report.aiFeedback && (
                                                    <p className="text-xs text-gray-500 mt-2 italic line-clamp-1">
                                                        AI: {report.aiFeedback}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    employeeName={selectedEmployeeName}
                    onClose={() => setSelectedReport(null)}
                    onReview={(notes, score) => handleReview(selectedReport.id, notes, score)}
                />
            )}
        </div>
    );

    async function handleReview(reportId: number, notes: string, score?: number) {
        try {
            await reviewDailyReport(reportId, notes, score);
            setSelectedReport(null);
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
    employeeName,
    onClose,
    onReview,
}: {
    report: DailyReport;
    employeeName: string;
    onClose: () => void;
    onReview: (notes: string, score?: number) => void;
}) {
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewScore, setReviewScore] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onReview(reviewNotes, reviewScore ? parseInt(reviewScore) : undefined);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold">{employeeName}'s Report</h2>
                            <p className="text-purple-100 text-sm">
                                {new Date(report.reportDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    {report.aiScore !== null && (
                        <div className="mt-4 flex items-center gap-4">
                            <div className="bg-white/20 rounded-lg px-4 py-2">
                                <p className="text-xs text-purple-100">AI Score</p>
                                <p className="text-2xl font-bold">{report.aiScore.toFixed(0)}%</p>
                            </div>
                            {report.kpiAlignmentScore !== null && (
                                <div className="bg-white/20 rounded-lg px-4 py-2">
                                    <p className="text-xs text-purple-100">KPI Alignment</p>
                                    <p className="text-2xl font-bold">{report.kpiAlignmentScore.toFixed(0)}%</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Tasks Completed */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Tasks Completed</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{report.tasksCompleted}</p>
                    </div>

                    {/* Tasks In Progress */}
                    {report.tasksInProgress && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Tasks In Progress</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.tasksInProgress}</p>
                        </div>
                    )}

                    {/* Blockers */}
                    {report.blockers && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Blockers
                            </h3>
                            <p className="text-gray-700 whitespace-pre-wrap bg-red-50 p-3 rounded-lg border border-red-100">
                                {report.blockers}
                            </p>
                        </div>
                    )}

                    {/* Planned for Tomorrow */}
                    {report.plannedForTomorrow && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Planned for Tomorrow</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.plannedForTomorrow}</p>
                        </div>
                    )}

                    {/* Additional Notes */}
                    {report.additionalNotes && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Notes</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.additionalNotes}</p>
                        </div>
                    )}

                    {/* AI Feedback */}
                    {report.aiFeedback && (
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <h3 className="text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                AI Feedback
                            </h3>
                            <p className="text-purple-900">{report.aiFeedback}</p>
                        </div>
                    )}

                    {/* AI Suggestions for Tomorrow */}
                    {report.aiSuggestions && (() => {
                        try {
                            const suggestions = JSON.parse(report.aiSuggestions);
                            if (Array.isArray(suggestions) && suggestions.length > 0) {
                                return (
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h3 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                            </svg>
                                            AI Suggestions for Tomorrow
                                        </h3>
                                        <ul className="space-y-2">
                                            {suggestions.map((suggestion: string, index: number) => (
                                                <li key={index} className="flex items-start gap-2 text-indigo-900">
                                                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                                                        {index + 1}
                                                    </span>
                                                    <span>{suggestion}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            }
                        } catch (e) {
                            // If parsing fails, show as text
                            return null;
                        }
                        return null;
                    })()}

                    {/* Previous Review */}
                    {report.reviewedAt && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <h3 className="text-sm font-semibold text-green-900 mb-2">Previous Review</h3>
                            <p className="text-green-800">{report.reviewerNotes}</p>
                            {report.reviewerScore !== null && (
                                <p className="text-sm text-green-600 mt-2">
                                    Score: {report.reviewerScore}%
                                </p>
                            )}
                        </div>
                    )}

                    {/* Review Form */}
                    {report.status !== 'reviewed' && (
                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Your Review</h3>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add feedback or comments..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            />
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Override Score (optional)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={reviewScore}
                                        onChange={(e) => setReviewScore(e.target.value)}
                                        placeholder="0-100"
                                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                                    />
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || !reviewNotes.trim()}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
