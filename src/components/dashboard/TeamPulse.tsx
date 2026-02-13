'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';
import { getTeamMembers, TeamMember } from '@/lib/api/team-lead';

export function TeamPulse() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await getTeamMembers(true);
        setMembers(data.members);
      } catch (err) {
        console.error('Failed to load team members:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadMembers();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {isLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading team pulse...
        </div>
      ) : members.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No team members found.
        </div>
      ) : (
        members.map((member) => {
          const hasReport = member.weekly_report_submitted;
          const auraScore =
            member.aura_score !== null ? member.aura_score / 20 : null;
          return (
            <Card key={member.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {member.full_name}
                </CardTitle>
                {hasReport ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Clock className="h-5 w-5 text-amber-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-xs text-muted-foreground">
                  {member.job_title || 'Team Member'}
                </div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>Aura Score</span>
                  <Badge variant="outline">
                    {auraScore !== null ? auraScore.toFixed(1) : '—'}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span>Weekly Report</span>
                  <Badge variant={hasReport ? 'secondary' : 'outline'}>
                    {hasReport ? 'Submitted' : 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
