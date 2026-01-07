"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Users,
    Star,
    TrendingUp,
    RefreshCw,
    EyeOff,
    Heart,
    Brain,
    Lightbulb,
    Shield,
    Target,
    Mail,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getPeerFeedbackStatus,
    PeerFeedbackMemberStatus
} from "@/lib/api/team-lead";

// Types
interface TeamMemberFeedbackStatus {
    id: string;
    name: string;
    role: string;
    department: string;
    avatarUrl?: string;
    hasSubmittedFeedback: boolean;
    feedbackSubmittedAt?: string;
    feedbackReceivedCount: number;
    // Anonymous aggregated scores (average across all peer ratings)
    aggregatedScores?: {
        support: number;
        collaboration: number;
        adaptability: number;
        values: number;
        accountability: number;
        feedback_openness: number;
        overall: number;
    };
}

// Get current week info
const getCurrentWeekInfo = () => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
    return { week: weekNumber, year: now.getFullYear() };
};

export default function PeerFeedbackStatusPage() {
    const [teamMembers, setTeamMembers] = useState<TeamMemberFeedbackStatus[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");
    const { week, year } = getCurrentWeekInfo();

    useEffect(() => {
        fetchFeedbackStatus();
    }, []);

    const fetchFeedbackStatus = async () => {
        setIsLoading(true);
        try {
            // Fetch real peer feedback status from API
            const data = await getPeerFeedbackStatus();

            // Map API response to our local interface
            const members: TeamMemberFeedbackStatus[] = data.members.map((m: PeerFeedbackMemberStatus) => ({
                id: m.id,
                name: m.full_name,
                role: m.job_title || 'Team Member',
                department: m.department,
                avatarUrl: m.avatar_url || undefined,
                hasSubmittedFeedback: m.has_submitted_feedback,
                feedbackReceivedCount: m.feedback_received_count,
                aggregatedScores: m.aggregated_scores ? {
                    support: m.aggregated_scores.support,
                    collaboration: m.aggregated_scores.collaboration,
                    adaptability: m.aggregated_scores.adaptability,
                    values: m.aggregated_scores.values,
                    accountability: m.aggregated_scores.accountability,
                    feedback_openness: m.aggregated_scores.feedback_openness,
                    overall: m.aggregated_scores.overall,
                } : undefined,
            }));

            setTeamMembers(members);
        } catch (err) {
            console.error('Error fetching feedback status:', err);
            toast.error('Failed to load feedback status');
        } finally {
            setIsLoading(false);
        }
    };

    // Stats
    const totalMembers = teamMembers.length;
    const submittedCount = teamMembers.filter(m => m.hasSubmittedFeedback).length;
    const pendingCount = totalMembers - submittedCount;
    const submissionRate = totalMembers > 0 ? Math.round((submittedCount / totalMembers) * 100) : 0;

    const pendingMembers = teamMembers.filter(m => !m.hasSubmittedFeedback);
    const submittedMembers = teamMembers.filter(m => m.hasSubmittedFeedback);

    // Send reminder to pending members
    const sendReminders = () => {
        toast.success(`Reminder sent to ${pendingCount} team members`);
    };

    // Send reminder to single member
    const sendSingleReminder = (member: TeamMemberFeedbackStatus) => {
        toast.success(`Reminder sent to ${member.name}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-muted-foreground">Loading feedback status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Peer Feedback Status</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Track feedback submissions and view anonymous aggregated scores for Week {week}, {year}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchFeedbackStatus}
                        className="text-xs"
                    >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Refresh
                    </Button>
                    {pendingCount > 0 && (
                        <Button
                            size="sm"
                            onClick={sendReminders}
                            className="text-xs bg-amber-500 hover:bg-amber-600"
                        >
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            Send Reminders ({pendingCount})
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Total Members</span>
                        </div>
                        <p className="text-3xl font-normal">{totalMembers}</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-emerald-100 p-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Submitted</span>
                        </div>
                        <p className="text-3xl font-normal text-emerald-600">{submittedCount}</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-amber-100 p-2">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Pending</span>
                        </div>
                        <p className="text-3xl font-normal text-amber-600">{pendingCount}</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-blue-100 p-2">
                                <TrendingUp className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Completion Rate</span>
                        </div>
                        <p className="text-3xl font-normal">{submissionRate}%</p>
                        <Progress value={submissionRate} className="h-1.5 mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="overview" className="text-xs">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        Pending ({pendingCount})
                    </TabsTrigger>
                    <TabsTrigger value="scores" className="text-xs">
                        <Star className="h-3.5 w-3.5 mr-1.5" />
                        Team Scores
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <Card className="border-border/40">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-normal">All Team Members</CardTitle>
                            <CardDescription className="text-xs">
                                Feedback submission status for this week
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border/40">
                                {teamMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-border/40">
                                                <AvatarImage src={member.avatarUrl} />
                                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{member.name}</p>
                                                <p className="text-xs text-muted-foreground">{member.role}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {member.hasSubmittedFeedback ? (
                                                <>
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Submitted
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {member.feedbackSubmittedAt
                                                            ? new Date(member.feedbackSubmittedAt).toLocaleDateString()
                                                            : ''}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[10px]"
                                                        onClick={() => sendSingleReminder(member)}
                                                    >
                                                        <Mail className="h-3 w-3 mr-1" />
                                                        Remind
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pending Tab */}
                <TabsContent value="pending" className="space-y-4">
                    {pendingMembers.length === 0 ? (
                        <Card className="border-border/40">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <div className="rounded-full bg-emerald-100 p-4 mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-sm font-medium text-gray-800">All feedback submitted!</h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Everyone has completed their peer feedback this week.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border/40 border-amber-200">
                            <CardHeader className="pb-3 bg-amber-50/50 border-b border-amber-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-normal flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            Pending Submissions
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                            These team members haven&apos;t submitted their peer feedback yet
                                        </CardDescription>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={sendReminders}
                                        className="text-xs bg-amber-500 hover:bg-amber-600"
                                    >
                                        <Mail className="h-3.5 w-3.5 mr-1" />
                                        Remind All
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-3">
                                    {pendingMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 rounded-lg bg-amber-50/30 border border-amber-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-amber-200">
                                                    <AvatarImage src={member.avatarUrl} />
                                                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.role} • {member.department}</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => sendSingleReminder(member)}
                                                className="text-xs border-amber-200 hover:bg-amber-100"
                                            >
                                                <Mail className="h-3.5 w-3.5 mr-1.5" />
                                                Send Reminder
                                            </Button>
                                        </div>
                                    ))}
                                </div>

                                {/* Impact Notice */}
                                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-100">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-red-700">Aura Score Impact</p>
                                            <p className="text-[11px] text-red-600 mt-0.5">
                                                Team members who don&apos;t submit peer feedback by end of week will receive
                                                a -{pendingCount * 2} point penalty on their Aura score.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Scores Tab - Anonymous Aggregated */}
                <TabsContent value="scores" className="space-y-4">
                    <Card className="border-border/40 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <EyeOff className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-indigo-900">Anonymous Feedback Scores</p>
                                    <p className="text-[11px] text-indigo-700 mt-0.5">
                                        Scores shown are averages from all peer feedback. Individual feedback content is not visible.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/40">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-normal">Team Performance Overview</CardTitle>
                            <CardDescription className="text-xs">
                                Aggregated peer ratings by pillar (based on {submittedCount} submissions)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-border/40">
                                {submittedMembers.filter(m => m.aggregatedScores).map((member) => (
                                    <div
                                        key={member.id}
                                        className="py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-border/40">
                                                    <AvatarImage src={member.avatarUrl} />
                                                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {member.feedbackReceivedCount} peer reviews
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100">
                                                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                                    <span className="text-sm font-semibold text-amber-700">
                                                        {member.aggregatedScores?.overall}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Score breakdown */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {[
                                                { key: 'support', label: 'Support', icon: Heart, color: 'rose' },
                                                { key: 'collaboration', label: 'Collaboration', icon: Users, color: 'blue' },
                                                { key: 'adaptability', label: 'Adaptability', icon: Brain, color: 'purple' },
                                                { key: 'values', label: 'Values', icon: Shield, color: 'emerald' },
                                                { key: 'accountability', label: 'Accountability', icon: Target, color: 'amber' },
                                                { key: 'feedback_openness', label: 'Openness', icon: Lightbulb, color: 'indigo' },
                                            ].map(({ key, label, icon: Icon, color }) => (
                                                <div
                                                    key={key}
                                                    className={`flex items-center gap-2 p-2 rounded-lg bg-${color}-50/50`}
                                                >
                                                    <Icon className={`h-3.5 w-3.5 text-${color}-500`} />
                                                    <span className="text-[10px] text-muted-foreground flex-1">{label}</span>
                                                    <span className="text-xs font-semibold">
                                                        {member.aggregatedScores?.[key as keyof typeof member.aggregatedScores]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
