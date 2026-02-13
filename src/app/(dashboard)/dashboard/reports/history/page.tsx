'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Download, FileText, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { getBackendBaseUrl } from '@/lib/api/backend-url';
import {
  getWeeklyReportDetails,
  getWeeklyReportHistory,
  type WeeklyReportDetail,
  type WeeklyReportHistoryEntry,
} from '@/lib/api/team-lead';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

export default function WeeklyReportHistoryPage() {
  const [reports, setReports] = useState<WeeklyReportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] =
    useState<WeeklyReportHistoryEntry | null>(null);
  const [detailReports, setDetailReports] = useState<WeeklyReportDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyReportHistory();
      setReports(data.reports || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load report history'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const resolveReportUrl = (url?: string | null) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) {
      return `${getBackendBaseUrl()}${url}`;
    }
    return `https://${url}`;
  };

  const openReportDetails = async (report: WeeklyReportHistoryEntry) => {
    setSelectedReport(report);
    setDetailReports([]);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const data = await getWeeklyReportDetails(report.weekNumber, report.year);
      setDetailReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      setDetailError(
        err instanceof Error ? err.message : 'Failed to load report details'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeReportDetails = () => {
    setSelectedReport(null);
    setDetailReports([]);
    setDetailError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Weekly Report History
            </h1>
            <p className="text-sm text-slate-500">
              Review previous team submissions and attachments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={loadHistory}
              className="bg-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Link
              href="/dashboard/reports"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              Back to reports
            </Link>
          </div>
        </header>

        {error && (
          <Card className="border-rose-200 bg-rose-50/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-rose-700">
                Unable to load history
              </CardTitle>
              <CardDescription className="text-rose-600">
                {error}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Submissions
            </CardTitle>
            <CardDescription>
              Weekly reports submitted by your team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading history...
              </div>
            ) : reports.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
                No weekly reports submitted yet.
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={`${report.year}-${report.weekNumber}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openReportDetails(report)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openReportDetails(report);
                    }
                  }}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-4 transition hover:border-slate-200 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Week {report.weekNumber}, {report.year}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(report.weekStartDate)} -{' '}
                        {formatDate(report.weekEndDate)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {report.submittedCount} team member
                        {report.submittedCount === 1 ? '' : 's'} rated · Last
                        update {formatDate(report.lastSubmittedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge
                      variant="outline"
                      className="border-emerald-100 bg-emerald-50 text-emerald-700"
                    >
                      {report.status || 'submitted'}
                    </Badge>
                    {report.teamReportUrl ? (
                      <a
                        href={resolveReportUrl(report.teamReportUrl)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        <Download className="h-4 w-4" />
                        Download summary
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">
                        No attachment
                      </span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        openReportDetails(report);
                      }}
                      className="bg-white"
                    >
                      View details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <CustomDialog
        open={selectedReport !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeReportDetails();
          }
        }}
        title={
          selectedReport
            ? `Week ${selectedReport.weekNumber} • ${selectedReport.year}`
            : undefined
        }
        description="Weekly report details and team ratings."
      >
        {detailError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {detailError}
          </div>
        )}
        {selectedReport && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Submission summary
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(selectedReport.weekStartDate)} -{' '}
                  {formatDate(selectedReport.weekEndDate)} ·{' '}
                  {selectedReport.submittedCount} ratings
                </p>
              </div>
              {selectedReport.teamReportUrl ? (
                <a
                  href={resolveReportUrl(selectedReport.teamReportUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Download team report
                </a>
              ) : (
                <span className="text-xs text-slate-400">
                  No team report attachment
                </span>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Team member ratings
                  </p>
                  <p className="text-xs text-slate-500">
                    Highlights and focus areas for the week.
                  </p>
                </div>
                {detailLoading && (
                  <span className="text-xs text-slate-500">Loading...</span>
                )}
              </div>
              <div className="max-h-[420px] space-y-3 overflow-y-auto p-4">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-6 text-xs text-slate-500">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading details...
                  </div>
                ) : detailReports.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500">
                    No member ratings found for this week.
                  </div>
                ) : (
                  detailReports.map((detail) => (
                    <div
                      key={detail.id}
                      className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {detail.employeeName || 'Team member'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {detail.department || '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-white text-slate-700"
                          >
                            {detail.grade || '—'}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {detail.weeklyAura != null
                              ? `${(detail.weeklyAura / 20).toFixed(1)} Aura`
                              : 'No score'}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          Technical: {detail.technicalScore ?? '—'}
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          Behavioral: {detail.behavioralScore ?? '—'}
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          Culture Fit: {detail.cultureFitScore ?? '—'}
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          Growth: {detail.growthLearningScore ?? '—'}
                        </div>
                      </div>

                      {(detail.weeklyHighlights ||
                        detail.areasForFocus ||
                        detail.behavioralNotes) && (
                        <div className="grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                          {detail.weeklyHighlights && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Highlights
                              </p>
                              <p className="mt-1 text-slate-600">
                                {detail.weeklyHighlights}
                              </p>
                            </div>
                          )}
                          {detail.areasForFocus && (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                Areas for focus
                              </p>
                              <p className="mt-1 text-slate-600">
                                {detail.areasForFocus}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </CustomDialog>
    </div>
  );
}
