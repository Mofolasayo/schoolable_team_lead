'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  X,
  Loader2,
  AlertCircle,
  Star,
  ClipboardCopy,
} from 'lucide-react';
import { CustomDialog } from '@/components/ui/custom-dialog';
import {
  getTeamMembers,
  TeamMember,
  TeamMembersResponse,
} from '@/lib/api/team-lead';
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
function getPillarValue(
  pillars: TeamMember['pillars'],
  key: 'technical' | 'behavioral' | 'culture' | 'growth'
): number {
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
        setError(
          err instanceof Error ? err.message : 'Failed to fetch team members'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading team members...</p>
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
            Failed to Load Team
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

  const teamMembers = teamData?.members || [];
  const selectedAuraScore =
    selectedMember?.aura_score != null ? selectedMember.aura_score / 20 : null;

  return (
    <div className="w-full space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Team
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {teamData?.member_count || 0} Active Members •{' '}
            {teamData?.department || 'Department'}
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
        <div className="py-12 text-center">
          <p className="text-slate-500">
            No team members found in your department.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teamMembers.map((member) => {
            const memberAuraScore =
              member.aura_score !== null ? member.aura_score / 20 : null;
            return (
              <Card
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`group cursor-pointer shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md ${
                  member.is_team_lead
                    ? 'border-indigo-300 ring-2 ring-indigo-200'
                    : ''
                }`}
              >
                <CardContent className="p-5">
                  {/* Team Lead Badge */}
                  {member.is_team_lead && (
                    <div className="mb-3">
                      <Badge className="border-0 bg-indigo-600 text-[10px] text-white">
                        👑 Team Lead
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <Avatar
                        className={`h-12 w-12 border ${member.is_team_lead ? 'border-indigo-300' : 'border-slate-100'}`}
                      >
                        <AvatarImage src={getAvatarUrl(member)} />
                        <AvatarFallback>
                          {member.full_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${
                          member.status === 'active'
                            ? 'bg-emerald-500'
                            : 'bg-slate-300'
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600">
                        {member.full_name}
                      </h3>
                      <p className="truncate text-xs text-slate-500">
                        {member.job_title || 'Team Member'}
                      </p>

                      {/* Aura Score */}
                      <div className="mt-2 flex items-center gap-2">
                        {memberAuraScore !== null ? (
                          <>
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              <span className="text-xs font-bold text-slate-700">
                                {memberAuraScore.toFixed(1)}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`h-4 py-0 text-[10px] ${
                                member.aura_grade === 'A'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : member.aura_grade === 'B'
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : member.aura_grade === 'C'
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-slate-50 text-slate-700'
                              }`}
                            >
                              Grade {member.aura_grade}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">
                            No Aura data
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weekly Report Status - Only show for non-team-lead members */}
                  {!member.is_team_lead && (
                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Weekly Report
                        </span>
                        {member.weekly_report_submitted ? (
                          <Badge className="border-0 bg-emerald-50 text-[10px] text-emerald-700">
                            Submitted
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-200 text-[10px] text-amber-600"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
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
            <div className="relative h-24 bg-gradient-to-r from-indigo-500 to-violet-500">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute right-4 top-4 rounded-full bg-black/10 p-1.5 text-white transition-colors hover:bg-black/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="-mt-10 px-6 pb-6">
              {/* Profile Image */}
              <div className="mb-4 flex items-end justify-between">
                <Avatar className="h-20 w-20 border-4 border-white bg-white shadow-sm">
                  <AvatarImage src={getAvatarUrl(selectedMember)} />
                  <AvatarFallback>
                    {selectedMember.full_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    selectedMember.status === 'active'
                      ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                      : 'border-slate-100 bg-slate-50 text-slate-600'
                  }`}
                >
                  {selectedMember.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="mb-6 space-y-1">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedMember.full_name}
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  {selectedMember.job_title || 'Team Member'} •{' '}
                  {selectedMember.department}
                </p>
              </div>

              {/* Aura Score Card */}
              {selectedMember.aura_score !== null && (
                <div className="mb-4 rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                      Aura Score
                    </span>
                    <Badge className="border border-indigo-200 bg-white text-indigo-700">
                      Grade {selectedMember.aura_grade}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                    <span className="text-2xl font-bold text-slate-900">
                      {selectedAuraScore != null
                        ? selectedAuraScore.toFixed(1)
                        : '—'}
                    </span>
                  </div>

                  {/* Pillar breakdown */}
                  {selectedMember.pillars && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="text-xs">
                        <span className="text-slate-500">Technical:</span>
                        <span className="ml-1 font-semibold text-slate-700">
                          {getPillarValue(
                            selectedMember.pillars,
                            'technical'
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Behavioral:</span>
                        <span className="ml-1 font-semibold text-slate-700">
                          {getPillarValue(
                            selectedMember.pillars,
                            'behavioral'
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Culture:</span>
                        <span className="ml-1 font-semibold text-slate-700">
                          {getPillarValue(
                            selectedMember.pillars,
                            'culture'
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="text-xs">
                        <span className="text-slate-500">Growth:</span>
                        <span className="ml-1 font-semibold text-slate-700">
                          {getPillarValue(
                            selectedMember.pillars,
                            'growth'
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Contact Details */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <a
                    href={`mailto:${selectedMember.email}`}
                    className="transition-colors hover:text-indigo-600"
                  >
                    {selectedMember.email}
                  </a>
                </div>
                {selectedMember.employee_id && (
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="h-4 w-4 font-mono text-xs text-slate-400">
                      ID
                    </span>
                    <span>{selectedMember.employee_id}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 border-t border-slate-50 pt-6">
                <Button
                  variant="outline"
                  className="w-full border-slate-200"
                  onClick={() => {
                    // Copy employee details to clipboard
                    const auraScore =
                      selectedAuraScore != null
                        ? selectedAuraScore.toFixed(1)
                        : 'N/A';
                    const details = `${selectedMember.full_name}\n${selectedMember.job_title || 'Team Member'}\n${selectedMember.email}\nEmployee ID: ${selectedMember.employee_id || 'N/A'}\nAura Score: ${auraScore}`;
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
