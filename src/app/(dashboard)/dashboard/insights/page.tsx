'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  generateAiInsight,
  getAiJobStatus,
  getEmployeeInsights,
  getInsightHistory,
  getLatestInsight,
  getMyKpis,
  getMyTeamScore,
  getTeamMembers,
  getWeeklyReportHistory,
  getWeeklyReportStatus,
  type AiInsight,
  type AiInsightGenerateResponse,
  type AiJobStatus,
  type PersonalInsightsResponse,
  type TeamKpi,
  type TeamMember,
  type TeamQuarterlyScore,
  type WeeklyReportHistoryEntry,
  type WeeklyReportStatusResponse,
} from '@/lib/api/team-lead';
import { getAvatarUrl } from '@/lib/avatar';
import { getBackendBaseUrl } from '@/lib/api/backend-url';

function getCurrentQuarter() {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const resolveReportUrl = (url?: string | null) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) {
    return `${getBackendBaseUrl()}${url}`;
  }
  return `https://${url}`;
};

const getScoreTone = (score?: number | null) => {
  if (score == null) {
    return {
      label: 'No data',
      text: 'text-slate-600',
      bg: 'bg-white',
      border: 'border-slate-200',
      badge: 'border-slate-200 bg-white text-slate-600',
    };
  }
  if (score >= 80) {
    return {
      label: 'Healthy',
      text: 'text-emerald-700',
      bg: 'bg-white',
      border: 'border-slate-200',
      badge: 'border-emerald-200 bg-white text-emerald-700',
    };
  }
  if (score >= 60) {
    return {
      label: 'Watch',
      text: 'text-amber-700',
      bg: 'bg-white',
      border: 'border-slate-200',
      badge: 'border-amber-200 bg-white text-amber-700',
    };
  }
  if (score >= 45) {
    return {
      label: 'At risk',
      text: 'text-orange-700',
      bg: 'bg-white',
      border: 'border-slate-200',
      badge: 'border-orange-200 bg-white text-orange-700',
    };
  }
  return {
    label: 'Critical',
    text: 'text-rose-700',
    bg: 'bg-white',
    border: 'border-slate-200',
    badge: 'border-rose-200 bg-white text-rose-700',
  };
};

function InsightsPageContent() {
  const [teamInsight, setTeamInsight] = useState<AiInsight | null>(null);
  const [insightHistory, setInsightHistory] = useState<AiInsight[]>([]);
  const [teamScore, setTeamScore] = useState<TeamQuarterlyScore | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [kpis, setKpis] = useState<TeamKpi[]>([]);
  const [weeklyStatus, setWeeklyStatus] =
    useState<WeeklyReportStatusResponse | null>(null);
  const [reportHistory, setReportHistory] = useState<
    WeeklyReportHistoryEntry[]
  >([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberInsights, setMemberInsights] =
    useState<PersonalInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);
  const [jobStatus, setJobStatus] = useState<AiJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuarter = getCurrentQuarter();
  const currentYear = new Date().getFullYear();
  const searchParams = useSearchParams();
  const weekParam = searchParams.get('week');
  const yearParam = searchParams.get('year');
  const selectedWeek = weekParam ? Number.parseInt(weekParam, 10) : NaN;
  const selectedYear = yearParam ? Number.parseInt(yearParam, 10) : NaN;
  const targetWeek =
    Number.isFinite(selectedWeek) && selectedWeek > 0
      ? selectedWeek
      : undefined;
  const targetYear =
    Number.isFinite(selectedYear) && selectedYear > 0
      ? selectedYear
      : undefined;

  useEffect(() => {
    fetchData();
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [targetWeek, targetYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        insightRes,
        historyRes,
        scoreRes,
        teamRes,
        kpiRes,
        statusRes,
        historyReportsRes,
      ] = await Promise.all([
        getLatestInsight(),
        getInsightHistory(),
        getMyTeamScore(currentQuarter, currentYear),
        getTeamMembers(false),
        getMyKpis(currentQuarter, currentYear).catch(() => ({ kpis: [] })),
        getWeeklyReportStatus(targetWeek, targetYear).catch(() => null),
        getWeeklyReportHistory(targetYear).catch(() => ({ reports: [] })),
      ]);

      if ('summary' in insightRes) {
        setTeamInsight(insightRes);
      } else {
        setTeamInsight(null);
      }

      const insights = historyRes.insights || [];
      const uniqueInsights = insights.reduce((acc: AiInsight[], insight) => {
        const key = `${insight.weekNumber}-${insight.year}`;
        const existing = acc.find((i) => `${i.weekNumber}-${i.year}` === key);
        if (!existing) {
          acc.push(insight);
        } else {
          const existingDate = new Date(existing.generatedAt).getTime();
          const currentDate = new Date(insight.generatedAt).getTime();
          if (currentDate > existingDate) {
            const index = acc.indexOf(existing);
            acc[index] = insight;
          }
        }
        return acc;
      }, []);

      uniqueInsights.sort((a, b) => b.weekNumber - a.weekNumber);
      setInsightHistory(uniqueInsights);

      if ('overallTeamScore' in scoreRes) {
        setTeamScore(scoreRes);
      } else {
        setTeamScore(null);
      }

      setTeamMembers(teamRes.members || []);
      setKpis(kpiRes.kpis || []);
      setWeeklyStatus(statusRes);
      setReportHistory(historyReportsRes.reports || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const pollInsightJob = async (jobId: string, attempt = 0) => {
    try {
      const status = await getAiJobStatus(jobId);
      setJobStatus(status);

      if (status.status === 'COMPLETED') {
        await fetchData();
        setGenerating(false);
        return;
      }

      if (status.status === 'FAILED' || status.status === 'DEAD') {
        setError(status.lastError || 'Insight generation failed');
        setGenerating(false);
        return;
      }

      if (attempt < 20) {
        pollingRef.current = setTimeout(
          () => pollInsightJob(jobId, attempt + 1),
          3000
        );
      } else {
        setGenerating(false);
        setError(
          'Insight generation is taking longer than expected. Please refresh.'
        );
      }
    } catch (err) {
      console.error('Error polling AI job:', err);
      setGenerating(false);
    }
  };

  const handleGenerateInsight = async () => {
    try {
      setGenerating(true);
      setError(null);
      setJobStatus(null);

      const result: AiInsightGenerateResponse = await generateAiInsight(
        targetWeek,
        targetYear
      );

      if (result.insight) {
        setTeamInsight(result.insight);
        await fetchData();
        setGenerating(false);
        return;
      }

      if (result.jobId) {
        pollInsightJob(result.jobId);
        return;
      }

      await fetchData();
      setGenerating(false);
    } catch (err) {
      console.error('Error generating insight:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate insight';

      if (errorMessage.toLowerCase().includes('no kpis')) {
        setError(
          'No KPIs defined yet. Create KPIs first to generate insights.'
        );
      } else if (errorMessage.toLowerCase().includes('no data')) {
        setError(
          'Not enough data to generate insights. Submit weekly reports first.'
        );
      } else {
        setError(errorMessage);
      }
      setGenerating(false);
    }
  };

  const handleSelectMember = async (memberId: string) => {
    try {
      setSelectedMember(memberId);
      setLoadingMember(true);
      const insights = await getEmployeeInsights(memberId);
      setMemberInsights(insights);
    } catch (err) {
      console.error('Error fetching member insights:', err);
    } finally {
      setLoadingMember(false);
    }
  };

  const latestScore = teamInsight?.kpiScore ?? null;
  const hasKpis = kpis.length > 0;
  const weeklyTone = getScoreTone(latestScore);
  const quarterTone = getScoreTone(teamScore?.overallTeamScore ?? null);
  const riskItems = teamInsight?.riskAlerts?.items || [];
  const needsAttentionItems = teamInsight?.insights?.needsAttention || [];
  const topPerformingItems = teamInsight?.insights?.topPerforming || [];
  const achievementItems = teamInsight?.insights?.achievements || [];
  const challengeItems = teamInsight?.insights?.challenges || [];
  const highlightItems = [...topPerformingItems, ...achievementItems];
  const focusItems = [...needsAttentionItems, ...challengeItems];
  const memberScore = memberInsights?.aiInsights?.performanceScore ?? null;
  const memberTone = getScoreTone(memberScore);
  const latestInsightAt =
    teamInsight?.generatedAt || insightHistory[0]?.generatedAt || null;
  const latestInsightWeek =
    teamInsight?.weekNumber || insightHistory[0]?.weekNumber || null;
  const reportProgress =
    weeklyStatus && weeklyStatus.team_size > 0
      ? Math.round(
          (weeklyStatus.submitted_count / weeklyStatus.team_size) * 100
        )
      : 0;
  const pendingReports = weeklyStatus
    ? Math.max(weeklyStatus.team_size - weeklyStatus.submitted_count, 0)
    : null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 p-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <Brain className="h-5 w-5 text-indigo-600" />
            Team Insights
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Weekly KPI progress and team report analysis for {currentQuarter}{' '}
            {currentYear}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-white">
            {currentQuarter} {currentYear}
          </Badge>
          <Badge
            variant="outline"
            className="border-slate-200 bg-white text-slate-600"
          >
            {teamMembers.length} members
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleGenerateInsight}
            disabled={generating}
            className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? 'Generating…' : 'Generate insight'}
          </Button>
        </div>
      </header>

      {error && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Insight generation issue
              </p>
              <p className="mt-1 text-sm text-amber-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {jobStatus &&
        (jobStatus.status === 'PENDING' || jobStatus.status === 'RUNNING') && (
          <Card className="border-slate-200 bg-white">
            <CardContent className="flex items-center gap-3 p-4">
              <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
              <p className="text-sm text-slate-600">
                Insight job is running. This usually completes in a few seconds.
              </p>
            </CardContent>
          </Card>
        )}

      {/* {teamInsight?.generationStatus === 'FALLBACK' && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Insight fallback</p>
              <p className="text-sm text-amber-700 mt-1">{teamInsight.summary}</p>
            </div>
          </CardContent>
        </Card>
      )} */}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-slate-600"
              >
                {weeklyTone.label}
              </Badge>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm font-medium text-slate-500">
                Weekly team score
              </p>
              <div className="text-2xl font-semibold text-slate-900">
                {latestScore !== null ? `${latestScore.toFixed(1)}%` : '—'}
              </div>
              <p className="text-xs text-slate-400">
                Week {teamInsight?.weekNumber ?? '—'} •{' '}
                {teamInsight?.quarter ?? currentQuarter}{' '}
                {teamInsight?.year ?? currentYear}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Target className="h-5 w-5" />
              </div>
              {teamScore ? (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-600"
                >
                  {teamScore.grade} • {quarterTone.label}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-600"
                >
                  No score
                </Badge>
              )}
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm font-medium text-slate-500">
                Quarter KPI score
              </p>
              <div className="text-2xl font-semibold text-slate-900">
                {teamScore ? `${teamScore.overallTeamScore.toFixed(1)}%` : '—'}
              </div>
              <p className="text-xs text-slate-400">
                {teamScore
                  ? `${teamScore.quarter} ${teamScore.year}`
                  : `${currentQuarter} ${currentYear}`}{' '}
                • {teamScore?.teamName || 'Your team'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                {weeklyStatus?.is_complete ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
              </div>
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-slate-600"
              >
                {weeklyStatus?.is_complete
                  ? 'Complete'
                  : pendingReports != null
                    ? `${pendingReports} pending`
                    : 'Pending'}
              </Badge>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-slate-500">
                Weekly reports
              </p>
              {weeklyStatus ? (
                <>
                  <div className="text-2xl font-semibold text-slate-900">
                    {weeklyStatus.submitted_count}/{weeklyStatus.team_size}
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{ width: `${reportProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400">
                    Week {weeklyStatus.week} • {weeklyStatus.year}
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-500">Status unavailable.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Brain className="h-5 w-5" />
              </div>
              <Badge
                variant="outline"
                className="border-slate-200 bg-white text-slate-600"
              >
                {latestInsightWeek
                  ? `Week ${latestInsightWeek}`
                  : 'Not generated'}
              </Badge>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-sm font-medium text-slate-500">
                Latest insight
              </p>
              <div className="text-2xl font-semibold text-slate-900">
                {latestInsightAt ? formatDate(latestInsightAt) : '—'}
              </div>
              <p className="text-xs text-slate-400">
                {latestInsightAt
                  ? 'Most recent AI summary'
                  : 'Generate insights to see history'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Latest team insight
              </CardTitle>
              <CardDescription>
                {teamInsight
                  ? `Generated ${formatDate(teamInsight.generatedAt)}`
                  : 'No insights generated yet.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {teamInsight ? (
                <>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-600"
                    >
                      Week {teamInsight.weekNumber}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-600"
                    >
                      {teamInsight.quarter} {teamInsight.year}
                    </Badge>
                    {latestScore !== null && (
                      <Badge
                        variant="outline"
                        className="border-slate-200 bg-white text-slate-600"
                      >
                        KPI score {latestScore.toFixed(1)}%
                      </Badge>
                    )}
                    {/* {teamInsight.generationStatus === 'FALLBACK' && (
                      <Badge variant="outline" className="border-amber-200 bg-white text-amber-700">
                        Fallback analysis
                      </Badge>
                    )} */}
                  </div>

                  <p className="text-sm leading-relaxed text-slate-700">
                    {teamInsight.summary}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      KPI score:{' '}
                      {latestScore != null ? `${latestScore.toFixed(1)}%` : '—'}
                    </span>
                    <span>Top signals: {topPerformingItems.length}</span>
                    <span>Risk alerts: {riskItems.length}</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Highlights
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {highlightItems.length > 0 ? (
                          highlightItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <Target className="mt-1 h-3 w-3 text-slate-400" />
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400">No highlights yet.</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Needs attention
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {focusItems.length > 0 ? (
                          focusItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="mt-1 h-3 w-3 text-slate-400" />
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-400">
                            No blockers identified.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Recommendations
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {(teamInsight.recommendations?.items || []).length >
                        0 ? (
                          teamInsight.recommendations.items?.map(
                            (item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <ChevronRight className="mt-1 h-3 w-3 text-slate-400" />
                                {item}
                              </li>
                            )
                          )
                        ) : (
                          <li className="text-slate-400">
                            No recommendations yet.
                          </li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Risk alerts
                        </p>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-600"
                        >
                          {riskItems.length}
                        </Badge>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-slate-700">
                        {riskItems.length > 0 ? (
                          riskItems.map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertTriangle className="mt-1 h-3 w-3 text-slate-400" />
                              {item}
                            </li>
                          ))
                        ) : (
                          <li className="text-slate-500">No risks flagged.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    Generate your first insight to see KPI progress details.
                  </p>
                  <div className="mt-3">
                    <Button
                      onClick={handleGenerateInsight}
                      disabled={generating}
                      size="sm"
                    >
                      Generate insight
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Quarter KPIs
              </CardTitle>
              <CardDescription>
                {hasKpis
                  ? `${currentQuarter} ${currentYear} targets`
                  : 'No KPIs created yet'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasKpis ? (
                kpis.map((kpi) => (
                  <div
                    key={kpi.id}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {kpi.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Target: {kpi.targetValue} {kpi.targetUnit || 'units'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-white text-slate-600"
                    >
                      {kpi.weight}%
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">
                  Set KPI targets to unlock weekly insights.
                  <div className="mt-2">
                    <Link
                      href="/dashboard/kpis"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Create KPIs
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Insight history
                </CardTitle>
                <CardDescription>Most recent weekly insights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {insightHistory.length > 0 ? (
                  insightHistory.slice(0, 5).map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50/60"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Week {insight.weekNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(insight.generatedAt)}
                        </p>
                      </div>
                      <div className="text-sm text-slate-600">
                        {insight.kpiScore?.toFixed(1)}%
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No insights generated yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Report history
                </CardTitle>
                <CardDescription>
                  Latest weekly report submissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {reportHistory.length > 0 ? (
                  reportHistory.slice(0, 3).map((report) => (
                    <div
                      key={`${report.year}-${report.weekNumber}`}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50/60"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Week {report.weekNumber}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(report.weekEndDate)}
                        </p>
                      </div>
                      {report.teamReportUrl ? (
                        <a
                          href={resolveReportUrl(report.teamReportUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No file</span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    No weekly reports submitted yet.
                  </p>
                )}
                <Link
                  href="/dashboard/reports/history"
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View full history
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Team members
              </CardTitle>
              <CardDescription>
                Select a member to view personal insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member.id)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    selectedMember === member.id
                      ? 'border-indigo-200 bg-indigo-50/40'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/40'
                  }`}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={getAvatarUrl({
                        avatar_url: member.avatar_url,
                        employee_id: member.employee_id,
                        email: member.email,
                        full_name: member.full_name,
                      })}
                    />
                    <AvatarFallback className="bg-slate-100 text-slate-500">
                      {member.full_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {member.full_name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {member.job_title || member.email}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              ))}
            </CardContent>
          </Card>

          {selectedMember && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Member insight
                </CardTitle>
                <CardDescription>Latest personal AI feedback.</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMember ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : memberInsights ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {memberInsights.employeeName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {memberInsights.department}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                      <p className="text-2xl font-semibold text-slate-900">
                        {(
                          ((memberInsights.aiInsights?.performanceScore || 0) /
                            100) *
                          5
                        ).toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-500">
                        Performance rating
                      </p>
                      <div className="mt-2 flex justify-center">
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-white text-slate-600"
                        >
                          {memberTone.label}
                        </Badge>
                      </div>
                    </div>

                    {memberInsights.aiInsights?.overallAssessment && (
                      <p className="text-sm text-slate-600">
                        {memberInsights.aiInsights.overallAssessment}
                      </p>
                    )}

                    {(
                      memberInsights.aiInsights?.actionableRecommendations || []
                    ).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Recommendations
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-slate-700">
                          {memberInsights.aiInsights.actionableRecommendations
                            .slice(0, 3)
                            .map((rec, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <Target className="mt-1 h-3 w-3 text-slate-400" />
                                {rec}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Select a team member to view insights.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-8 text-sm text-slate-500">
          Loading insights...
        </div>
      }
    >
      <InsightsPageContent />
    </Suspense>
  );
}
