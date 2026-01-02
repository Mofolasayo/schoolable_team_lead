'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Users, ArrowUpRight, Loader2, AlertCircle, Star, FileText } from 'lucide-react';
import { VelocityChart } from '@/components/dashboard/VelocityChart';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDashboardStats, getTeamMembers, DashboardStats, TeamMember } from '@/lib/api/team-lead';
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
          getTeamMembers()
        ]);

        setStats(statsData);
        setTeamMembers(teamData.members);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center p-6 max-w-md">
          <div className="p-3 bg-red-50 rounded-full">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">Failed to Load Dashboard</h3>
          <p className="text-sm text-slate-500">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Members needing weekly report
  const pendingReports = teamMembers.filter(m => !m.weekly_report_submitted);

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {stats?.team_lead_name || 'Team Lead'}. Here&apos;s what&apos;s happening with your team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white">
            Week {stats?.weekly_reports.current_week} • {stats?.weekly_reports.year}
          </Badge>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
            {stats?.department}
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Team Size */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-100/50 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">Team Members</h3>
              <div className="text-2xl font-bold text-slate-900">{stats?.team_size || 0}</div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats?.department}</p>
          </CardContent>
        </Card>

        {/* Total Tasks */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-blue-100/50 text-blue-600">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">Total Team Tasks</h3>
              <div className="text-2xl font-bold text-slate-900">{stats?.tasks.total || 0}</div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {stats?.tasks.in_progress || 0} in progress • {stats?.tasks.pending || 0} pending
            </p>
          </CardContent>
        </Card>

        {/* Tasks Completed */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-100/50 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0 font-medium">
                +{stats?.tasks.completed || 0}
              </Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">Tasks Completed</h3>
              <div className="text-2xl font-bold text-slate-900">{stats?.tasks.completed || 0}</div>
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats?.tasks.total || 0} total tasks</p>
          </CardContent>
        </Card>

        {/* Team Aura */}
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-violet-100/50 text-violet-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-slate-500">Team Avg. Aura</h3>
              <div className="text-2xl font-bold text-slate-900">
                {stats?.team_performance.average_aura_score?.toFixed(1) || '0.0'}
                <span className="text-sm font-normal text-slate-400"> / 5.0</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {stats?.team_performance.members_with_aura_data || 0} members with data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart Column */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Sprint Velocity</CardTitle>
                <CardDescription className="text-slate-500">Story points completed over the last 6 sprints.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <VelocityChart />
          </CardContent>
        </Card>

        {/* Weekly Reports Status */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">Weekly Reports</CardTitle>
                <CardDescription className="text-slate-500">Week {stats?.weekly_reports.current_week} submission status</CardDescription>
              </div>
              {stats?.weekly_reports.is_complete ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Complete</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-200">Pending</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="py-6">
            <div className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Progress</span>
                  <span>{stats?.weekly_reports.reports_submitted || 0} / {stats?.weekly_reports.reports_required || 0}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${stats?.weekly_reports.reports_required
                        ? (stats.weekly_reports.reports_submitted / stats.weekly_reports.reports_required) * 100
                        : 0}%`
                    }}
                  />
                </div>
              </div>

              {/* Pending Members */}
              {pendingReports.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-slate-500">Pending Reports:</p>
                  <div className="space-y-2">
                    {pendingReports.slice(0, 3).map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="text-[9px]">{member.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-600">{member.full_name}</span>
                      </div>
                    ))}
                    {pendingReports.length > 3 && (
                      <p className="text-xs text-slate-400">+{pendingReports.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Link href="/dashboard/reports">
                <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
                  <FileText className="mr-2 h-4 w-4" />
                  {stats?.weekly_reports.is_complete ? 'View Reports' : 'Submit Reports'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Quick View */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">Team Overview</CardTitle>
              <CardDescription className="text-slate-500">Quick view of your team members</CardDescription>
            </div>
            <Link href="/dashboard/team">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {teamMembers.slice(0, 6).map((member) => (
              <div key={member.id} className="flex flex-col items-center text-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Avatar className="h-12 w-12 mb-2">
                  <AvatarImage src={member.avatar_url} />
                  <AvatarFallback>{member.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <p className="text-xs font-medium text-slate-900 truncate w-full">{member.full_name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {member.aura_score !== null ? (
                    <>
                      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs text-slate-500">{member.aura_score.toFixed(1)}</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
