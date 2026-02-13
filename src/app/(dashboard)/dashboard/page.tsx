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
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  Zap,
  Users,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Star,
  FileText,
} from 'lucide-react';
import { VelocityChart } from '@/components/dashboard/VelocityChart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  getDashboardStats,
  getTeamMembers,
  DashboardStats,
  TeamMember,
} from '@/lib/api/team-lead';
import { getAvatarUrl } from '@/lib/avatar';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [statsData, teamData] = await Promise.all([
          getDashboardStats(),
          getTeamMembers(),
        ]);

        setStats(statsData);
        setTeamMembers(teamData.members);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
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
            Failed to Load Dashboard
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

  // Members needing weekly report
  const pendingReports = teamMembers.filter((m) => !m.weekly_report_submitted);
  const teamAverageAura =
    stats?.team_performance?.average_aura_score != null
      ? stats.team_performance.average_aura_score / 20
      : 0;

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back, {stats?.team_lead_name || 'Team Lead'}. Here&apos;s
            what&apos;s happening with your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white">
            Week {stats?.weekly_reports.current_week} •{' '}
            {stats?.weekly_reports.year}
          </Badge>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
            {stats?.department}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Team Size */}
        <Card className="border-slate-200/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-indigo-100/50 p-2.5 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">
                Team Members
              </h3>
              <div className="text-2xl font-bold text-slate-900">
                {stats?.team_size || teamMembers.length || 0}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats?.department || 'Your Team'}
            </p>
          </CardContent>
        </Card>

        {/* Total Tasks */}
        <Card className="border-slate-200/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-blue-100/50 p-2.5 text-blue-600">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">
                Total Team Tasks
              </h3>
              <div className="text-2xl font-bold text-slate-900">
                {stats?.tasks.total || 0}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats?.tasks.in_progress || 0} in progress •{' '}
              {stats?.tasks.pending || 0} pending
            </p>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card className="border-slate-200/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-emerald-100/50 p-2.5 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <Badge
                variant="secondary"
                className="border-0 bg-emerald-50 font-medium text-emerald-700"
              >
                +{stats?.tasks.completed || 0}
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">
                Tasks Completed
              </h3>
              <div className="text-2xl font-bold text-slate-900">
                {stats?.tasks.completed || 0}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats?.tasks.total || 0} total tasks
            </p>
          </CardContent>
        </Card>

        {/* Team Aura */}
        <Card className="border-slate-200/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-xl bg-violet-100/50 p-2.5 text-violet-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">
                Team Avg. Aura
              </h3>
              <div className="text-2xl font-bold text-slate-900">
                {teamAverageAura.toFixed(1)}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {stats?.team_performance.members_with_aura_data || 0} members with
              data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Column */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Sprint Velocity
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Story points completed over the last 6 sprints.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <VelocityChart />
          </CardContent>
        </Card>

        {/* Weekly Reports Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Weekly Reports
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Week {stats?.weekly_reports.current_week} submission status
                </CardDescription>
              </div>
              {stats?.weekly_reports.is_complete ? (
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Complete
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-amber-200 text-amber-600"
                >
                  Pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-6">
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Progress</span>
                  <span>
                    {stats?.weekly_reports.reports_submitted || 0} /{' '}
                    {stats?.weekly_reports.reports_required || 0}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: `${
                        stats?.weekly_reports.reports_required
                          ? (stats.weekly_reports.reports_submitted /
                              stats.weekly_reports.reports_required) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Pending Members */}
              {pendingReports.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-slate-500">
                    Pending Reports:
                  </p>
                  <div className="space-y-2">
                    {pendingReports.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-lg bg-slate-50 p-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={getAvatarUrl({
                              avatar_url: member.avatar_url,
                              employee_id: member.employee_id,
                              email: member.email,
                              full_name: member.full_name,
                            })}
                          />
                          <AvatarFallback className="text-[9px]">
                            {member.full_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-600">
                          {member.full_name}
                        </span>
                      </div>
                    ))}
                    {pendingReports.length > 3 && (
                      <p className="text-xs text-slate-400">
                        +{pendingReports.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link href="/dashboard/reports">
                <Button className="mt-4 w-full bg-indigo-600 text-white hover:bg-indigo-700">
                  <FileText className="mr-2 h-4 w-4" />
                  {stats?.weekly_reports.is_complete
                    ? 'View Reports'
                    : 'Submit Reports'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Quick View */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/30 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Team Overview
              </CardTitle>
              <CardDescription className="text-slate-500">
                Quick view of your team members
              </CardDescription>
            </div>
            <Link href="/dashboard/team">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
              >
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {teamMembers.slice(0, 6).map((member) => {
              const memberAuraScore =
                member.aura_score !== null ? member.aura_score / 20 : null;
              return (
                <div
                  key={member.id}
                  className="flex flex-col items-center rounded-lg p-3 text-center transition-colors hover:bg-slate-50"
                >
                  <Avatar className="mb-2 h-12 w-12 shadow-sm ring-2 ring-white">
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
                  <p className="w-full truncate text-xs font-medium text-slate-900">
                    {member.full_name}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    {memberAuraScore !== null ? (
                      <>
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs text-slate-500">
                          {memberAuraScore.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
