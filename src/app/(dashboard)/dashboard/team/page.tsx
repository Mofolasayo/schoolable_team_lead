'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Mail, X, Loader2, AlertCircle, Star, ClipboardCopy } from 'lucide-react';
import { CustomDialog } from '@/components/ui/custom-dialog'
import { getTeamMembers, TeamMember, TeamMembersResponse } from '@/lib/api/team-lead';
import { toast } from 'sonner';

// Helper to generate avatar URL matching mobile app logic
function getAvatarUrl(member: TeamMember): string {
    // Use avatar_url if provided by backend
    if (member.avatar_url && member.avatar_url.length > 0) {
        return member.avatar_url;
    }

    // Generate DiceBear avatar with gender-based style
    const seed = member.employee_id || member.email || member.full_name || 'User';
    // Note: We don't have gender in TeamMember type, so use bottts as default
    // The backend should now return proper gender-based avatar_url
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
}

// Helper to safely extract pillar value (handles both old complex and new simple format)
function getPillarValue(pillars: TeamMember['pillars'], key: 'technical' | 'behavioral' | 'culture' | 'growth'): number {
    if (!pillars) return 0;

    const value = pillars[key];

    // If it's a number, return it directly (new format)
    if (typeof value === 'number') {
        return value;
    }

    // If it's an object with a score property (old format), extract the score
    if (value && typeof value === 'object' && 'score' in value) {
        return (value as { score: number }).score || 0;
    }

    return 0;
}

export default function MyTeamPage() {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [teamData, setTeamData] = useState<TeamMembersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getTeamMembers();
                setTeamData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch team members');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-500">Loading team members...</p>
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
                    <h3 className="text-lg font-semibold text-slate-900">Failed to Load Team</h3>
                    <p className="text-sm text-slate-500">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    const teamMembers = teamData?.members || [];

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Team</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {teamData?.member_count || 0} Active Members • {teamData?.department || 'Department'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white">
                        Week {teamData?.current_week} • {teamData?.year}
                    </Badge>
                </div>
            </div>

            {/* Team Members Grid */}
            {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500">No team members found in your department.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {teamMembers.map((member) => (
                        <Card
                            key={member.id}
                            onClick={() => setSelectedMember(member)}
                            className={`group hover:border-indigo-200 transition-all duration-200 shadow-sm cursor-pointer hover:shadow-md ${member.is_team_lead ? 'ring-2 ring-indigo-200 border-indigo-300' : ''
                                }`}
                        >
                            <CardContent className="p-5">
                                {/* Team Lead Badge */}
                                {member.is_team_lead && (
                                    <div className="mb-3">
                                        <Badge className="bg-indigo-600 text-white text-[10px] border-0">
                                            👑 Team Lead
                                        </Badge>
                                    </div>
                                )}

                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <Avatar className={`h-12 w-12 border ${member.is_team_lead ? 'border-indigo-300' : 'border-slate-100'}`}>
                                            <AvatarImage src={getAvatarUrl(member)} />
                                            <AvatarFallback>{member.full_name?.[0] || '?'}</AvatarFallback>
                                        </Avatar>
                                        <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'
                                            }`} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                                            {member.full_name}
                                        </h3>
                                        <p className="text-xs text-slate-500 truncate">{member.job_title || 'Team Member'}</p>

                                        {/* Aura Score */}
                                        <div className="flex items-center gap-2 mt-2">
                                            {member.aura_score !== null ? (
                                                <>
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {((member.aura_score / 100) * 5).toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`text-[10px] py-0 h-4 ${member.aura_grade === 'A' ? 'bg-emerald-50 text-emerald-700' :
                                                            member.aura_grade === 'B' ? 'bg-indigo-50 text-indigo-700' :
                                                                member.aura_grade === 'C' ? 'bg-amber-50 text-amber-700' :
                                                                    'bg-slate-50 text-slate-700'
                                                            }`}
                                                    >
                                                        Grade {member.aura_grade}
                                                    </Badge>
                                                </>
                                            ) : (
                                                <span className="text-xs text-slate-400">No Aura data</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly Report Status - Only show for non-team-lead members */}
                                {!member.is_team_lead && (
                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-500">Weekly Report</span>
                                            {member.weekly_report_submitted ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 text-[10px] border-0">
                                                    Submitted
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Member Details Modal */}
            <CustomDialog
                open={!!selectedMember}
                onOpenChange={(open) => !open && setSelectedMember(null)}
                title=""
                description=""
            >
                {selectedMember && (
                    <div className="flex flex-col">
                        {/* Header Banner */}
                        <div className="h-24 bg-gradient-to-r from-indigo-500 to-violet-500 relative">
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="absolute top-4 right-4 p-1.5 bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="px-6 pb-6 -mt-10">
                            {/* Profile Image */}
                            <div className="flex items-end justify-between mb-4">
                                <Avatar className="h-20 w-20 border-4 border-white shadow-sm bg-white">
                                    <AvatarImage src={getAvatarUrl(selectedMember)} />
                                    <AvatarFallback>{selectedMember.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${selectedMember.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-100'
                                    }`}>
                                    {selectedMember.status === 'active' ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h2 className="text-xl font-bold text-slate-900">{selectedMember.full_name}</h2>
                                <p className="text-sm text-slate-500 font-medium">
                                    {selectedMember.job_title || 'Team Member'} • {selectedMember.department}
                                </p>
                            </div>

                            {/* Aura Score Card */}
                            {selectedMember.aura_score !== null && (
                                <div className="p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 mb-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Aura Score</span>
                                        <Badge className="bg-white text-indigo-700 border border-indigo-200">
                                            Grade {selectedMember.aura_grade}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                                        <span className="text-2xl font-bold text-slate-900">{((selectedMember.aura_score / 100) * 5).toFixed(1)}</span>
                                        <span className="text-sm text-slate-500">/ 5.0</span>
                                    </div>

                                    {/* Pillar breakdown */}
                                    {selectedMember.pillars && (
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div className="text-xs">
                                                <span className="text-slate-500">Technical:</span>
                                                <span className="ml-1 font-semibold text-slate-700">{getPillarValue(selectedMember.pillars, 'technical').toFixed(0)}%</span>
                                            </div>
                                            <div className="text-xs">
                                                <span className="text-slate-500">Behavioral:</span>
                                                <span className="ml-1 font-semibold text-slate-700">{getPillarValue(selectedMember.pillars, 'behavioral').toFixed(0)}%</span>
                                            </div>
                                            <div className="text-xs">
                                                <span className="text-slate-500">Culture:</span>
                                                <span className="ml-1 font-semibold text-slate-700">{getPillarValue(selectedMember.pillars, 'culture').toFixed(0)}%</span>
                                            </div>
                                            <div className="text-xs">
                                                <span className="text-slate-500">Growth:</span>
                                                <span className="ml-1 font-semibold text-slate-700">{getPillarValue(selectedMember.pillars, 'growth').toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Contact Details */}
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    <a href={`mailto:${selectedMember.email}`} className="hover:text-indigo-600 transition-colors">
                                        {selectedMember.email}
                                    </a>
                                </div>
                                {selectedMember.employee_id && (
                                    <div className="flex items-center gap-3 text-sm text-slate-600">
                                        <span className="h-4 w-4 text-slate-400 text-xs font-mono">ID</span>
                                        <span>{selectedMember.employee_id}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="pt-6 mt-4 border-t border-slate-50">
                                <Button
                                    variant="outline"
                                    className="w-full border-slate-200"
                                    onClick={() => {
                                        // Copy employee details to clipboard
                                        const auraScore5 = selectedMember.aura_score ? ((selectedMember.aura_score / 100) * 5).toFixed(1) : 'N/A';
                                        const details = `${selectedMember.full_name}\n${selectedMember.job_title || 'Team Member'}\n${selectedMember.email}\nEmployee ID: ${selectedMember.employee_id || 'N/A'}\nAura Score: ${auraScore5}/5.0`;
                                        navigator.clipboard.writeText(details);
                                        toast.success('Profile details copied to clipboard!', {
                                            description: 'Employee information has been copied.',
                                        });
                                    }}
                                >
                                    <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Details
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CustomDialog>
        </div>
    );
}
