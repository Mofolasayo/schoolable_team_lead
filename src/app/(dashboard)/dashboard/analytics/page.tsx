'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  Users,
  Star,
  CheckCircle,
  FileText,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  getDashboardStats,
  getTeamMembers,
  getKpiProgress,
  getInsightHistory,
  getTeamTasks,
  DashboardStats,
  TeamMember,
  Task,
} from '@/lib/api/team-lead';
import { getAvatarUrl } from '@/lib/avatar';

interface WeeklyTrend {
  week: string;
  kpiProgress: number;
  teamScore: number;
}

interface MemberPerformance {
  id: string;
  name: string;
  avatarUrl?: string;
  auraScore: number | null;
  tasksCompleted: number;
  trend: 'up' | 'down' | 'stable';
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentWeek = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [statsData, teamData, tasksData, insightHistory] =
          await Promise.all([
            getDashboardStats(),
            getTeamMembers(),
            getTeamTasks(),
            getInsightHistory(),
          ]);

        setStats(statsData);
        setMembers(teamData.members);
        setTasks(tasksData);

        // Fetch weekly trends for the last 6 weeks
        const currentWeek = getCurrentWeek();
        const year = new Date().getFullYear();
        const trends: WeeklyTrend[] = [];
        const insightScores = new Map<number, number>();
        insightHistory.insights
          .filter((insight) => insight.year === year)
          .forEach((insight) => {
            if (!insightScores.has(insight.weekNumber)) {
              insightScores.set(insight.weekNumber, insight.kpiScore);
            }
          });

        for (let i = 5; i >= 0; i--) {
          const weekNum = currentWeek - i;
          if (weekNum > 0) {
            try {
              const progress = await getKpiProgress(weekNum, year);
              const totalProgress =
                progress.progress?.reduce(
                  (sum, p) => sum + (p.progressPercentage || 0),
                  0
                ) || 0;
              const avgProgress = progress.progress?.length
                ? Math.round(totalProgress / progress.progress.length)
                : 0;
              const weeklyScore = insightScores.get(weekNum) ?? 0;
              trends.push({
                week: `W${weekNum}`,
                kpiProgress: avgProgress,
                teamScore: weeklyScore,
              });
            } catch {
              trends.push({
                week: `W${weekNum}`,
                kpiProgress: 0,
                teamScore: 0,
              });
            }
          }
        }

        setWeeklyTrends(trends);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load analytics'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process member performance data - include ALL members including team lead
  const tasksByAssignee = new Map<string, { completed: number }>();
  tasks.forEach((task) => {
    const assigneeId = task.assignee_id;
    if (!assigneeId) return;
    const entry = tasksByAssignee.get(assigneeId) || { completed: 0 };
    const isDone = task.status === 'DONE';
    tasksByAssignee.set(assigneeId, {
      completed: entry.completed + (isDone ? 1 : 0),
    });
  });

  const memberPerformance: MemberPerformance[] = members
    .map((m) => {
      const auraScore = m.aura_score !== null ? m.aura_score / 20 : null;
      const completedTasks = tasksByAssignee.get(m.id)?.completed || 0;
      return {
        id: m.id,
        name: m.full_name,
        avatarUrl: getAvatarUrl({
          avatar_url: m.avatar_url,
          employee_id: m.employee_id,
          email: m.email,
          full_name: m.full_name,
        }),
        auraScore,
        tasksCompleted: completedTasks,
        trend: (auraScore && auraScore >= 3.5
          ? 'up'
          : auraScore && auraScore < 2.5
            ? 'down'
            : 'stable') as 'up' | 'down' | 'stable',
      };
    })
    .sort((a, b) => (b.auraScore || 0) - (a.auraScore || 0));

  // Calculate summary metrics
  const avgAura =
    stats?.team_performance?.average_aura_score != null
      ? stats.team_performance.average_aura_score / 20
      : 0;
  const taskCompletionRate = stats?.tasks?.total
    ? Math.round((stats.tasks.completed / stats.tasks.total) * 100)
    : 0;
  const reportSubmissionRate = stats?.weekly_reports?.reports_required
    ? Math.round(
        (stats.weekly_reports.reports_submitted /
          stats.weekly_reports.reports_required) *
          100
      )
    : 0;
  const highPerformers = memberPerformance.filter(
    (m) => m.auraScore && m.auraScore >= 4.0
  ).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex max-w-md flex-col items-center gap-3 p-6 text-center">
          <div className="rounded-full bg-red-50 p-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            Failed to Load Analytics
          </h3>
          <p className="text-sm text-slate-500">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Team Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Productivity trends, task completion velocity, and Aura score
            analytics
          </p>
        </div>
        <Badge variant="outline" className="bg-white">
          Week {getCurrentWeek()} • {new Date().getFullYear()}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-amber-100/50 p-2.5 text-amber-600">
                <Star className="h-5 w-5" />
              </div>
              <Badge className="border-0 bg-amber-50 text-amber-700">
                {avgAura.toFixed(1)}
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-slate-500">
              Avg. Team Aura
            </h3>
            <div className="text-2xl font-bold text-slate-900">
              {avgAura.toFixed(1)}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats?.team_performance?.members_with_aura_data || 0} members
              with data
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-emerald-100/50 p-2.5 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <Badge className="border-0 bg-emerald-50 text-emerald-700">
                {taskCompletionRate}%
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-slate-500">
              Task Completion
            </h3>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.tasks?.completed || 0}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              of {stats?.tasks?.total || 0} total tasks
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-indigo-100/50 p-2.5 text-indigo-600">
                <FileText className="h-5 w-5" />
              </div>
              <Badge className="border-0 bg-indigo-50 text-indigo-700">
                {reportSubmissionRate}%
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-slate-500">
              Reports Submitted
            </h3>
            <div className="text-2xl font-bold text-slate-900">
              {stats?.weekly_reports?.reports_submitted || 0}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              of {stats?.weekly_reports?.reports_required || 0} required
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="bg-primary/10/50 rounded-xl p-2.5 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Badge className="border-0 bg-purple-50 text-purple-700">
                {highPerformers}
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-slate-500">
              High Performers
            </h3>
            <div className="text-2xl font-bold text-slate-900">
              {highPerformers}
            </div>
            <p className="mt-2 text-xs text-slate-400">Aura score ≥ 4.0</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* KPI Progress Trend */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              <CardTitle className="text-base font-semibold text-slate-900">
                KPI Progress Velocity
              </CardTitle>
            </div>
            <CardDescription>Weekly KPI progress over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {weeklyTrends.length > 0 &&
            weeklyTrends.some((t) => t.kpiProgress > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [`${value}%`, 'Progress']}
                  />
                  <Bar
                    dataKey="kpiProgress"
                    fill="hsl(238 75% 62%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] flex-col items-center justify-center text-slate-400">
                <BarChart3 className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-sm">No velocity data yet</p>
                <p className="mt-1 text-xs">
                  Submit weekly reports to track progress
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team KPI Score Trend */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base font-semibold text-slate-900">
                Team KPI Score Trend
              </CardTitle>
            </div>
            <CardDescription>Weekly AI-graded team KPI scores</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {weeklyTrends.length > 0 &&
            weeklyTrends.some((t) => t.teamScore > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value) => [`${value}%`, 'Team score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="teamScore"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: 'white', stroke: '#f59e0b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] flex-col items-center justify-center text-slate-400">
                <Star className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-sm">No team score data yet</p>
                <p className="mt-1 text-xs">
                  Generate insights to start tracking weekly scores
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Member Leaderboard */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Team Performance Leaderboard
              </CardTitle>
              <CardDescription>Members ranked by Aura score</CardDescription>
            </div>
            <Badge variant="outline" className="bg-white">
              {memberPerformance.length} members
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {memberPerformance.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {memberPerformance.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  {/* Rank */}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? 'bg-amber-100 text-amber-700'
                        : index === 1
                          ? 'bg-slate-200 text-slate-600'
                          : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Avatar & Name */}
                  <Avatar className="h-10 w-10 border border-slate-100">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {member.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {member.trend === 'up' && (
                        <ChevronUp className="h-3 w-3 text-emerald-500" />
                      )}
                      {member.trend === 'down' && (
                        <ChevronDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className="text-xs text-slate-400">
                        {member.trend === 'up'
                          ? 'Improving'
                          : member.trend === 'down'
                            ? 'Needs attention'
                            : 'Stable'}
                      </span>
                    </div>
                  </div>

                  {/* Aura Score */}
                  <div className="text-right">
                    {member.auraScore !== null ? (
                      <>
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span className="text-lg font-bold text-slate-900">
                            {member.auraScore.toFixed(1)}
                          </span>
                        </div>
                        <Progress
                          value={(member.auraScore / 5) * 100}
                          className="mt-1 h-1.5 w-20"
                        />
                      </>
                    ) : (
                      <span className="text-sm text-slate-400">No data</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Users className="mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">No team members found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
