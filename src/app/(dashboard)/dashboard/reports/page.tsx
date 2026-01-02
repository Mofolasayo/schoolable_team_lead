"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
    ChevronRight
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getTeamMembers, submitBatchWeeklyReports, TeamMember as ApiTeamMember } from "@/lib/api/team-lead";

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
    initiative: number;        // -> initiativeScore in backend
    attitude: number;          // -> attitudeTowardsWorkScore in backend
    teamwork: number;          // -> teamworkCollaborationScore in backend
}

interface WeeklyReport {
    employeeId: string;
    ratings: TeamLeadRating;
    weeklyHighlights: string;
    areasForFocus: string;
}

// SIMPLIFIED Rating items - Only soft skills that can't be auto-calculated
// Technical tasks, attendance, compliance, and training are now auto-calculated!
const RATING_ITEMS = [
    {
        key: "initiative" as const,
        name: "Initiative & Proactiveness",
        description: "Takes ownership, suggests improvements, works without constant direction.",
        icon: Zap,
        color: "text-blue-600",
        bgColor: "bg-blue-50"
    },
    {
        key: "attitude" as const,
        name: "Attitude & Mindset",
        description: "Positive approach to work, handles challenges well, remains positive.",
        icon: Smile,
        color: "text-amber-600",
        bgColor: "bg-amber-50"
    },
    {
        key: "teamwork" as const,
        name: "Teamwork & Collaboration",
        description: "Communication quality, helps teammates, professional conduct.",
        icon: Users,
        color: "text-indigo-600",
        bgColor: "bg-indigo-50"
    }
];

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
    onChange
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
                    className="focus:outline-none transition-all hover:scale-110 p-1"
                >
                    <Star
                        className={`w-7 h-7 transition-all ${star <= (hovered ?? value)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 fill-slate-50"
                            }`}
                    />
                </button>
            ))}
            <span className="ml-3 text-sm font-medium text-slate-500 w-8">
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
    const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
    const [reports, setReports] = useState<Record<string, WeeklyReport>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [weekNumber] = useState(getCurrentWeekNumber());
    const [year] = useState(new Date().getFullYear());
    const [teamReportDocument, setTeamReportDocument] = useState<File | null>(null);
    const [showUploadPage, setShowUploadPage] = useState(false);

    // Fetch team members on mount
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setIsLoadingMembers(true);
                setLoadError(null);
                const data = await getTeamMembers(false); // Exclude self (team lead)
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
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : 'Failed to load team members');
            } finally {
                setIsLoadingMembers(false);
            }
        };
        fetchMembers();
    }, []);


    const currentMember = teamMembers[currentMemberIndex];
    const isLastMember = currentMemberIndex === teamMembers.length - 1;
    const isFirstMember = currentMemberIndex === 0;
    const totalSteps = teamMembers.length + 1; // +1 for upload page

    // Initialize report for current member if not exists
    useEffect(() => {
        if (currentMember && !reports[currentMember.id]) {
            setReports((prev) => ({
                ...prev,
                [currentMember.id]: {
                    employeeId: currentMember.id,
                    ratings: { initiative: 0, attitude: 0, teamwork: 0 },
                    weeklyHighlights: "",
                    areasForFocus: "",
                },
            }));
        }
    }, [currentMember, reports]);

    const memberId = currentMember?.id ?? "";
    const currentReport = reports[memberId] || {
        employeeId: memberId,
        ratings: { initiative: 0, attitude: 0, teamwork: 0 },
        weeklyHighlights: "",
        areasForFocus: "",
    };

    // Check if current member's report is complete
    // Simplified: only 3 ratings now
    const isCurrentReportComplete =
        currentReport.ratings.initiative > 0 &&
        currentReport.ratings.attitude > 0 &&
        currentReport.ratings.teamwork > 0;

    // Count completed reports
    const completedCount = Object.values(reports).filter(
        (r) => r.ratings.initiative > 0 && r.ratings.attitude > 0 && r.ratings.teamwork > 0
    ).length;

    const allRatingsComplete = completedCount === teamMembers.length;

    // Handlers
    const updateRating = (ratingKey: keyof TeamLeadRating, value: number) => {
        if (!currentMember) return;
        const id = currentMember.id;
        const existing = reports[id] || {
            employeeId: id,
            ratings: { initiative: 0, attitude: 0, teamwork: 0 },
            weeklyHighlights: "",
            areasForFocus: "",
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

    const updateNotes = (field: "weeklyHighlights" | "areasForFocus", value: string) => {
        if (!currentMember) return;
        const id = currentMember.id;
        const existing = reports[id] || {
            employeeId: id,
            ratings: { initiative: 0, attitude: 0, teamwork: 0 },
            weeklyHighlights: "",
            areasForFocus: "",
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
            fileInputRef.current.value = "";
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
        toast.success("Draft saved successfully");
    };

    const handleSubmitAll = async () => {
        if (!allRatingsComplete) {
            toast.error("Please complete ratings for all team members before submitting.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Prepare batch request with simplified ratings
            // Field names match backend WeeklyPerformanceReport entity
            const batchRequest = {
                weekNumber,
                year,
                reports: Object.values(reports).map((report) => ({
                    employeeId: report.employeeId,
                    // Map frontend fields to backend field names
                    initiativeScore: report.ratings.initiative,
                    attitudeTowardsWorkScore: report.ratings.attitude,
                    teamworkCollaborationScore: report.ratings.teamwork,
                    weeklyHighlights: report.weeklyHighlights,
                    areasForFocus: report.areasForFocus,
                }))
            };

            // Submit via API
            await submitBatchWeeklyReports(batchRequest);

            toast.success(`Week ${weekNumber} reports submitted successfully!`);
        } catch (error) {
            toast.error("Failed to submit reports. Please try again.");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentStep = showUploadPage ? totalSteps : currentMemberIndex + 1;
    const completionPercentage = (currentStep / totalSteps) * 100;

    // Report Summary Page (Final Step)
    if (showUploadPage) {
        return (
            <div className="min-h-screen bg-slate-50/50 p-8">
                <div className="max-w-3xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Final Review & Submit</h1>
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
                        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
                            <div className="h-1 bg-indigo-500 w-full" />
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold text-slate-900">Team Ratings Summary</CardTitle>
                                <CardDescription>Review completion status before final submission.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {teamMembers.map((member) => {
                                        const report = reports[member.id];
                                        const isComplete = report &&
                                            report.ratings.initiative > 0 &&
                                            report.ratings.attitude > 0 &&
                                            report.ratings.teamwork > 0;

                                        return (
                                            <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-slate-100">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium text-slate-700">{member.name}</span>
                                                </div>
                                                {isComplete ? (
                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                        <Check className="h-4 w-4" />
                                                        <span className="text-xs font-semibold uppercase tracking-wide">Complete</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-amber-500">
                                                        <Clock className="h-4 w-4" />
                                                        <span className="text-xs font-semibold uppercase tracking-wide">Pending</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Document Upload */}
                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-semibold text-slate-900">Attach Weekly Summary</CardTitle>
                                <CardDescription>Upload the consolidated PDF/Doc report for the engineering department.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {teamReportDocument ? (
                                    <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
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
                                            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/10 transition-all group">
                                        <div className="h-10 w-10 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 rounded-full flex items-center justify-center transition-colors mb-2">
                                            <Upload className="w-5 h-5" />
                                        </div>
                                        <span className="text-sm text-slate-600 font-medium">Click to upload report</span>
                                        <span className="text-xs text-slate-400 mt-1">PDF or DOCX</span>
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
                    <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
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
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 animate-spin" /> Processing...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Final Submit
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
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Progress Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Weekly Performance Report</h1>
                            <div className="mt-1 flex items-center gap-2">
                                <Badge variant="outline" className="bg-white font-normal text-slate-600">
                                    Week {weekNumber}
                                </Badge>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-sm text-slate-500">{year}</span>
                            </div>
                        </div>
                        <Button variant="ghost" onClick={handleSaveDraft} className="text-slate-500 hover:text-indigo-600">
                            <Save className="w-4 h-4 mr-2" /> Save Draft
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-slate-500 uppercase tracking-wide">
                            <span>Progress</span>
                            <span>{Math.round(completionPercentage)}%</span>
                        </div>
                        <Progress value={completionPercentage} className="h-1.5 w-full bg-slate-200" />
                    </div>
                </div>

                {/* Profile Card */}
                <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                    <div className="h-24 bg-gradient-to-r from-indigo-500 to-violet-500 relative">
                        <div className="absolute -bottom-8 left-8">
                            <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                                <AvatarImage src={currentMember?.avatarUrl} />
                                <AvatarFallback className="text-xl bg-slate-100">{currentMember?.name[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    <CardContent className="pt-10 px-8 pb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{currentMember?.name}</h2>
                                <p className="text-slate-500 font-medium">{currentMember?.role} • {currentMember?.department}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Status</p>
                                {isCurrentReportComplete ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-0">Rated</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-slate-500">Pending</Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ratings Section */}
                <div className="grid gap-4">
                    {RATING_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const rating = currentReport.ratings[item.key];

                        return (
                            <Card key={item.key} className="border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-100">
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        <div className={`p-3 h-12 w-12 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center shrink-0`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{item.name}</h3>
                                                <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
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
                    <CardHeader className="pb-2 border-b border-slate-50">
                        <CardTitle className="text-base font-semibold text-slate-900">Weekly Observations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Highlights & Wins</label>
                            <textarea
                                value={currentReport.weeklyHighlights}
                                onChange={(e) => updateNotes("weeklyHighlights", e.target.value)}
                                placeholder="What did they do well this week?"
                                className="w-full h-24 bg-slate-50 border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Areas for Growth</label>
                            <textarea
                                value={currentReport.areasForFocus}
                                onChange={(e) => updateNotes("areasForFocus", e.target.value)}
                                placeholder="What should they focus on next week?"
                                className="w-full h-24 bg-slate-50 border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Navigation Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                    <Button
                        variant="ghost"
                        onClick={goToPreviousMember}
                        disabled={isFirstMember}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>

                    <div className="text-xs font-medium text-slate-400">
                        {currentMemberIndex + 1} of {teamMembers.length} Employees
                    </div>

                    <Button
                        onClick={goToNextMember}
                        disabled={!isCurrentReportComplete}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                        {isLastMember ? "Review & Submit" : "Next Employee"}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
