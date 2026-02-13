'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  Save,
  Clock,
  Star,
  Users,
  Zap,
  Smile,
  Upload,
  FileText,
  X,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  getTeamMembers,
  submitSimplifiedWeeklyReports,
  getReferenceData,
  getWeeklyReportStatus,
  type WeeklyReportStatusResponse,
  type ReferenceData,
  TeamMember as ApiTeamMember,
} from '@/lib/api/team-lead';

// Types
interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarUrl?: string;
}

// Simplified rating - only soft skills that can't be auto-calculated
// Field names match backend WeeklyPerformanceReport entity
interface TeamLeadRating {
  initiative: number; // -> initiativeScore in backend
  attitude: number; // -> attitudeTowardsWorkScore in backend
  teamwork: number; // -> teamworkCollaborationScore in backend
}

type RatingKey = keyof TeamLeadRating;

interface WeeklyReport {
  employeeId: string;
  ratings: TeamLeadRating;
  weeklyHighlights: string;
  areasForFocus: string;
}

const RATING_DECORATIONS: Record<
  RatingKey,
  { icon: typeof Zap; color: string; bgColor: string }
> = {
  initiative: {
    icon: Zap,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  attitude: {
    icon: Smile,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  teamwork: {
    icon: Users,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
};

const getCurrentWeekNumber = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.ceil(diff / oneWeek);
};

// Star Rating Component
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(star)}
          className="p-1 transition-all hover:scale-110 focus:outline-none"
        >
          <Star
            className={`h-7 w-7 transition-all ${
              star <= (hovered ?? value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-50 text-slate-200'
            }`}
          />
        </button>
      ))}
      <span className="ml-3 w-8 text-sm font-medium text-slate-500">
        {(hovered ?? value) > 0 ? (hovered ?? value) + '/5' : ''}
      </span>
    </div>
  );
}

export default function WeeklyReportsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [_isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [_loadError, setLoadError] = useState<string | null>(null);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [reports, setReports] = useState<Record<string, WeeklyReport>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weekNumber, setWeekNumber] = useState(getCurrentWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [teamReportDocument, setTeamReportDocument] = useState<File | null>(
    null
  );
  const [showUploadPage, setShowUploadPage] = useState(false);
  const [weeklyStatus, setWeeklyStatus] =
    useState<WeeklyReportStatusResponse | null>(null);
  const [_statusLoading, setStatusLoading] = useState(true);

  // Fetch team members on mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoadingMembers(true);
        setLoadError(null);
        const [data, refs, status] = await Promise.all([
          getTeamMembers(false),
          getReferenceData().catch((err) => {
            console.warn('Failed to load reference data:', err);
            return null;
          }),
          getWeeklyReportStatus().catch((err) => {
            console.warn('Failed to load weekly report status:', err);
            return null;
          }),
        ]);
        // Transform API members to local format, filtering out any team leads
        const members: TeamMember[] = data.members
          .filter((m: ApiTeamMember) => !m.is_team_lead) // Only rate non-team-lead members
          .map((m: ApiTeamMember) => ({
            id: m.id,
            name: m.full_name,
            role: m.job_title || 'Team Member',
            department: m.department,
            avatarUrl: m.avatar_url,
          }));
        setTeamMembers(members);
        if (refs) {
          setReferenceData(refs);
        }
        if (status) {
          setWeeklyStatus(status);
          setWeekNumber(status.week);
          setYear(status.year);
        }
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : 'Failed to load team members'
        );
      } finally {
        setIsLoadingMembers(false);
        setStatusLoading(false);
      }
    };
    fetchMembers();
  }, []);

  const currentMember = teamMembers[currentMemberIndex];
  const isLastMember = currentMemberIndex === teamMembers.length - 1;
  const isFirstMember = currentMemberIndex === 0;
  const totalSteps = teamMembers.length + 1; // +1 for upload page
  const ratingItems = (referenceData?.weeklyReportCriteria ?? [])
    .filter((item) => item.key in RATING_DECORATIONS)
    .map((item) => {
      const key = item.key as RatingKey;
      return {
        ...item,
        key,
        ...(RATING_DECORATIONS[key] || {
          icon: Star,
          color: 'text-slate-500',
          bgColor: 'bg-slate-50',
        }),
      };
    });
  const isWeekSubmitted = weeklyStatus?.is_complete ?? false;
  const submittedCount = weeklyStatus?.submitted_count ?? 0;
  const teamSize = weeklyStatus?.team_size ?? teamMembers.length;

  // Initialize report for current member if not exists
  useEffect(() => {
    if (currentMember && !reports[currentMember.id]) {
      setReports((prev) => ({
        ...prev,
        [currentMember.id]: {
          employeeId: currentMember.id,
          ratings: { initiative: 0, attitude: 0, teamwork: 0 },
          weeklyHighlights: '',
          areasForFocus: '',
        },
      }));
    }
  }, [currentMember, reports]);

  const memberId = currentMember?.id ?? '';
  const currentReport = reports[memberId] || {
    employeeId: memberId,
    ratings: { initiative: 0, attitude: 0, teamwork: 0 },
    weeklyHighlights: '',
    areasForFocus: '',
  };

  // Check if current member's report is complete
  // Simplified: only 3 ratings now
  const isCurrentReportComplete =
    currentReport.ratings.initiative > 0 &&
    currentReport.ratings.attitude > 0 &&
    currentReport.ratings.teamwork > 0;

  // Count completed reports
  const completedCount = Object.values(reports).filter(
    (r) =>
      r.ratings.initiative > 0 &&
      r.ratings.attitude > 0 &&
      r.ratings.teamwork > 0
  ).length;

  const allRatingsComplete = completedCount === teamMembers.length;

  // Handlers
  const updateRating = (ratingKey: keyof TeamLeadRating, value: number) => {
    if (!currentMember) return;
    const id = currentMember.id;
    const existing = reports[id] || {
      employeeId: id,
      ratings: { initiative: 0, attitude: 0, teamwork: 0 },
      weeklyHighlights: '',
      areasForFocus: '',
    };
    setReports((prev) => ({
      ...prev,
      [id]: {
        ...existing,
        ratings: {
          ...existing.ratings,
          [ratingKey]: value,
        },
      },
    }));
  };

  const updateNotes = (
    field: 'weeklyHighlights' | 'areasForFocus',
    value: string
  ) => {
    if (!currentMember) return;
    const id = currentMember.id;
    const existing = reports[id] || {
      employeeId: id,
      ratings: { initiative: 0, attitude: 0, teamwork: 0 },
      weeklyHighlights: '',
      areasForFocus: '',
    };
    setReports((prev) => ({
      ...prev,
      [id]: {
        ...existing,
        [field]: value,
      },
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTeamReportDocument(file);
    }
  };

  const removeFile = () => {
    setTeamReportDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const goToNextMember = () => {
    if (isLastMember) {
      setShowUploadPage(true);
    } else {
      setCurrentMemberIndex((prev) => prev + 1);
    }
  };

  const goToPreviousMember = () => {
    if (showUploadPage) {
      setShowUploadPage(false);
    } else if (currentMemberIndex > 0) {
      setCurrentMemberIndex((prev) => prev - 1);
    }
  };

  const handleSaveDraft = () => {
    toast.success('Draft saved successfully');
  };

  const handleSubmitAll = async () => {
    if (isWeekSubmitted) {
      toast.info('Weekly reports are already submitted for this week.');
      return;
    }
    if (!allRatingsComplete) {
      toast.error(
        'Please complete ratings for all team members before submitting.'
      );
      return;
    }
    if (!teamReportDocument) {
      toast.error('Upload the team report document before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const maxFileSize = 10 * 1024 * 1024;
      if (teamReportDocument.size > maxFileSize) {
        toast.error('Report file exceeds the 10MB limit.');
        return;
      }

      const formData = new FormData();
      formData.append('file', teamReportDocument);

      const uploadRes = await fetch('/api/upload?folder=weekly-reports', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.json().catch(() => ({}));
        toast.error(
          uploadError.error || 'Failed to upload report. Please try again.'
        );
        return;
      }

      const uploadResult = await uploadRes.json();
      const teamReportUrl = uploadResult.url;

      const batchRequest = {
        weekNumber,
        year,
        teamReportUrl,
        ratings: Object.values(reports).map((report) => {
          const weeklyHighlights = report.weeklyHighlights.trim();
          const areasForFocus = report.areasForFocus.trim();
          return {
            employeeId: report.employeeId,
            initiativeScore: report.ratings.initiative,
            attitudeTowardsWorkScore: report.ratings.attitude,
            teamworkCollaborationScore: report.ratings.teamwork,
            weeklyHighlights: weeklyHighlights || undefined,
            areasForFocus: areasForFocus || undefined,
          };
        }),
      };

      await submitSimplifiedWeeklyReports(batchRequest);

      toast.success(`Week ${weekNumber} reports submitted successfully!`);
      const status = await getWeeklyReportStatus().catch(() => null);
      if (status) {
        setWeeklyStatus(status);
        setWeekNumber(status.week);
        setYear(status.year);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : null;
      if (message && message.toLowerCase().includes('already submitted')) {
        toast.error('Weekly reports already submitted for this week.');
        const status = await getWeeklyReportStatus().catch(() => null);
        if (status) {
          setWeeklyStatus(status);
          setWeekNumber(status.week);
          setYear(status.year);
        }
      } else {
        toast.error('Failed to submit reports. Please try again.');
      }
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = showUploadPage ? totalSteps : currentMemberIndex + 1;
  const completionPercentage = (currentStep / totalSteps) * 100;

  if (isWeekSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Weekly Reports
              </h1>
              <p className="text-sm text-slate-500">
                Week {weekNumber} • {year}
              </p>
            </div>
            <Link
              href="/dashboard/reports/history"
              className="text-sm font-medium text-slate-600 hover:text-slate-700"
            >
              View history
            </Link>
          </div>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100"
                >
                  Submitted
                </Badge>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  All team members rated
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {submittedCount}/{teamSize} reports submitted
                  </p>
                  <p className="text-xs text-slate-500">
                    Weekly reports are locked for this week.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ChevronRight className="h-3 w-3" />
                <span>
                  Visit history to view past submissions or download reports.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Report Summary Page (Final Step)
  if (showUploadPage) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Final Review & Submit
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>Week {weekNumber}</span>
                <span className="h-4 w-px bg-slate-200" />
                <span>{year}</span>
              </div>
            </div>
            <Progress value={100} className="h-1.5 w-full bg-slate-100" />
          </div>

          {/* Summary Cards */}
          <div className="grid gap-6">
            <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
              <div className="h-1 w-full bg-slate-200" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Team Ratings Summary
                </CardTitle>
                <CardDescription>
                  Review completion status before final submission.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {teamMembers.map((member) => {
                    const report = reports[member.id];
                    const isComplete =
                      report &&
                      report.ratings.initiative > 0 &&
                      report.ratings.attitude > 0 &&
                      report.ratings.teamwork > 0;

                    return (
                      <div
                        key={member.id}
                        className="group flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-slate-100">
                            <AvatarImage src={member.avatarUrl} />
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-slate-700">
                            {member.name}
                          </span>
                        </div>
                        {isComplete ? (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Complete
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">
                              Pending
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Attach Weekly Summary
                </CardTitle>
                <CardDescription>
                  Upload the consolidated PDF/Doc report for the engineering
                  department.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamReportDocument ? (
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="max-w-[200px] truncate text-sm font-medium text-slate-900">
                          {teamReportDocument.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(teamReportDocument.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="group flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 transition-all hover:border-slate-400 hover:bg-slate-50">
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors group-hover:bg-slate-100 group-hover:text-slate-600">
                      <Upload className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-600">
                      Click to upload report
                    </span>
                    <span className="mt-1 text-xs text-slate-400">
                      PDF or DOCX
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              onClick={goToPreviousMember}
              className="bg-white"
            >
              Back
            </Button>
            <Button
              onClick={handleSubmitAll}
              disabled={isSubmitting || !allRatingsComplete}
              className="flex-1 bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" /> Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" /> Final Submit
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Individual Member Rating View
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Progress Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Weekly Performance Report
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-white font-normal text-slate-600"
                >
                  Week {weekNumber}
                </Badge>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-sm text-slate-500">{year}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/reports/history"
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                View history
              </Link>
              <Button
                variant="ghost"
                onClick={handleSaveDraft}
                className="text-slate-500 hover:text-slate-700"
              >
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>Progress</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress
              value={completionPercentage}
              className="h-1.5 w-full bg-slate-200"
            />
          </div>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div className="relative h-24 bg-slate-100">
            <div className="absolute -bottom-8 left-8">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                <AvatarImage src={currentMember?.avatarUrl} />
                <AvatarFallback className="bg-slate-100 text-xl">
                  {currentMember?.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardContent className="px-8 pb-6 pt-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {currentMember?.name}
                </h2>
                <p className="font-medium text-slate-500">
                  {currentMember?.role} • {currentMember?.department}
                </p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Status
                </p>
                {isCurrentReportComplete ? (
                  <Badge className="border-0 bg-slate-100 text-slate-700 hover:bg-slate-200">
                    Rated
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-slate-500">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ratings Section */}
        <div className="grid gap-4">
          {ratingItems.map((item) => {
            const Icon = item.icon;
            const rating = currentReport.ratings[item.key];

            return (
              <Card
                key={item.key}
                className="border-slate-200 shadow-sm transition-all hover:border-slate-200 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div
                      className={`h-12 w-12 rounded-xl p-3 ${item.bgColor} ${item.color} flex shrink-0 items-center justify-center`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <div className="pt-2">
                        <StarRating
                          value={rating}
                          onChange={(value) => updateRating(item.key, value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Qualitative Feedback */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-50 pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Weekly Observations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Highlights & Wins
              </label>
              <textarea
                value={currentReport.weeklyHighlights}
                onChange={(e) =>
                  updateNotes('weeklyHighlights', e.target.value)
                }
                placeholder="What did they do well this week?"
                className="h-24 w-full resize-none rounded-lg border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-slate-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Areas for Growth
              </label>
              <textarea
                value={currentReport.areasForFocus}
                onChange={(e) => updateNotes('areasForFocus', e.target.value)}
                placeholder="What should they focus on next week?"
                className="h-24 w-full resize-none rounded-lg border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <Button
            variant="ghost"
            onClick={goToPreviousMember}
            disabled={isFirstMember}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="text-xs font-medium text-slate-400">
            {currentMemberIndex + 1} of {teamMembers.length} Employees
          </div>

          <Button
            onClick={goToNextMember}
            disabled={!isCurrentReportComplete}
            className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
          >
            {isLastMember ? 'Review & Submit' : 'Next Employee'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
