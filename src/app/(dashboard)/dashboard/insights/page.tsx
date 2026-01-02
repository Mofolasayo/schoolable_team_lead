'use client';

import { useEffect, useState } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Users,
  RefreshCw,
  ChevronRight,
  Star,
  Target,
  Sparkles
} from 'lucide-react';
import {
  getLatestInsight,
  getInsightHistory,
  generateAiInsight,
  getMyTeamScore,
  getEmployeeInsights,
  getTeamMembers,
  type AiInsight,
  type TeamQuarterlyScore,
  type PersonalInsightsResponse,
  type TeamMember,
} from '@/lib/api/team-lead';

export default function InsightsPage() {
  const [teamInsight, setTeamInsight] = useState<AiInsight | null>(null);
  const [insightHistory, setInsightHistory] = useState<AiInsight[]>([]);
  const [teamScore, setTeamScore] = useState<TeamQuarterlyScore | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [memberInsights, setMemberInsights] = useState<PersonalInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMember, setLoadingMember] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [insightRes, historyRes, scoreRes, teamRes] = await Promise.all([
        getLatestInsight(),
        getInsightHistory(),
        getMyTeamScore(),
        getTeamMembers(false), // Don't include self in team members list
      ]);

      if ('summary' in insightRes) {
        setTeamInsight(insightRes);
      }

      setInsightHistory(historyRes.insights || []);

      if ('overallTeamScore' in scoreRes) {
        setTeamScore(scoreRes);
      }

      setTeamMembers(teamRes.members || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    try {
      setGenerating(true);
      const result = await generateAiInsight();
      if (result.insight) {
        setTeamInsight(result.insight);
        fetchData();
      }
    } catch (err) {
      console.error('Error generating insight:', err);
      setError('Failed to generate insight');
    } finally {
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

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A': return 'text-emerald-500';
      case 'B': return 'text-blue-500';
      case 'C': return 'text-yellow-500';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-purple-500" />
            AI Insights
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered performance analysis and recommendations for your team
          </p>
        </div>
        <button
          onClick={handleGenerateInsight}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Generate New Insight
        </button>
      </header>

      {/* Team Score Card */}
      {teamScore && (
        <section className="rounded-lg border border-border bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{teamScore.teamName || 'Your Team'}</h2>
              <p className="text-sm text-muted-foreground">{teamScore.quarter} {teamScore.year}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold">{teamScore.overallTeamScore}%</span>
                <span className={`text-3xl font-bold ${getGradeColor(teamScore.grade)}`}>
                  {teamScore.grade}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </div>
          {teamScore.aiSummary && (
            <p className="mt-4 text-sm text-muted-foreground border-t border-border/50 pt-4">
              {teamScore.aiSummary}
            </p>
          )}
        </section>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Insights Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Insight */}
          {teamInsight ? (
            <section className="rounded-lg border border-border bg-background/80 p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Team Performance Summary</h2>
                  <p className="text-xs text-muted-foreground">
                    Week {teamInsight.weekNumber} • Generated {new Date(teamInsight.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </header>

              <p className="text-sm text-foreground leading-relaxed mb-6">
                {teamInsight.summary}
              </p>

              {/* Insights Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Top Performers */}
                {teamInsight.insights && (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium text-sm">Top Performing</span>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {(typeof teamInsight.insights === 'string'
                        ? JSON.parse(teamInsight.insights)
                        : teamInsight.insights
                      )?.topPerforming?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <Star className="h-3 w-3 mt-1 text-emerald-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Needs Attention */}
                {teamInsight.insights && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">Needs Attention</span>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {(typeof teamInsight.insights === 'string'
                        ? JSON.parse(teamInsight.insights)
                        : teamInsight.insights
                      )?.needsAttention?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="h-3 w-3 mt-1 text-amber-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {teamInsight.recommendations && (
                <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Recommendations</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(typeof teamInsight.recommendations === 'string'
                      ? JSON.parse(teamInsight.recommendations)
                      : teamInsight.recommendations
                    )?.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Target className="h-3 w-3 mt-1 text-blue-500" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Alerts */}
              {teamInsight.riskAlerts && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-sm">Risk Alerts</span>
                  </div>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {(typeof teamInsight.riskAlerts === 'string'
                      ? JSON.parse(teamInsight.riskAlerts)
                      : teamInsight.riskAlerts
                    )?.map((alert: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 mt-1 text-red-500" />
                        {alert}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">No Insights Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate your first AI-powered team insight to get started.
              </p>
              <button
                onClick={handleGenerateInsight}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {generating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Generate Insight
              </button>
            </section>
          )}

          {/* Insight History */}
          {insightHistory.length > 0 && (
            <section className="rounded-lg border border-border bg-background/80 p-6">
              <h2 className="text-lg font-semibold mb-4">Insight History</h2>
              <div className="space-y-3">
                {insightHistory.slice(0, 5).map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium">Week {insight.weekNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(insight.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{insight.kpiScore}%</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Team Members Column */}
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-background/80 p-6">
            <header className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Team Members</h2>
            </header>
            <p className="text-xs text-muted-foreground mb-4">
              Select a member to view their personalized AI insights
            </p>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleSelectMember(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${selectedMember === member.id
                    ? 'bg-purple-500/10 border border-purple-500/30'
                    : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {member.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.job_title || member.email}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>

          {/* Selected Member Insights */}
          {selectedMember && (
            <section className="rounded-lg border border-border bg-background/80 p-6">
              {loadingMember ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : memberInsights ? (
                <div className="space-y-4">
                  <header>
                    <h3 className="font-semibold">{memberInsights.employeeName}</h3>
                    <p className="text-xs text-muted-foreground">{memberInsights.department}</p>
                  </header>

                  {/* Performance Score */}
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 text-center">
                    <p className="text-3xl font-bold">
                      {memberInsights.aiInsights?.performanceScore || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Performance Score</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-semibold">
                        {memberInsights.performanceData?.completionRate?.toFixed(0) || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-lg font-semibold">
                        {memberInsights.performanceData?.punctualityRate?.toFixed(0) || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Punctuality</p>
                    </div>
                  </div>

                  {/* AI Assessment */}
                  {memberInsights.aiInsights?.overallAssessment && (
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="text-sm text-muted-foreground">
                        {memberInsights.aiInsights.overallAssessment}
                      </p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {memberInsights.aiInsights?.actionableRecommendations && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Recommendations:</p>
                      <ul className="space-y-1">
                        {memberInsights.aiInsights.actionableRecommendations.slice(0, 3).map((rec, i) => (
                          <li key={i} className="text-xs flex items-start gap-2">
                            <Target className="h-3 w-3 mt-0.5 text-blue-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Select a team member to view insights
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
