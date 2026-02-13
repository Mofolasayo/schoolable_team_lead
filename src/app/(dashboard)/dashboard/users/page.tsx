import type { Metadata } from 'next';
import { Plus } from 'lucide-react';
import { getTeamMembers } from '@/lib/api/team-lead';

export const metadata: Metadata = {
  title: 'User Management · Dashboard',
};

export default async function DashboardUsersPage() {
  let teamData: Awaited<ReturnType<typeof getTeamMembers>> | null = null;
  try {
    teamData = await getTeamMembers(true);
  } catch {
    teamData = null;
  }

  const teamLeadCount =
    teamData?.members.filter((member) => member.is_team_lead).length || 0;
  const memberCount = teamData?.members.length || 0;
  const departmentLabel = teamData?.department || 'Team';

  const teams = teamData
    ? [
        {
          name: `${departmentLabel} Leads`,
          members: teamLeadCount,
          description: 'Team leads and department coordinators.',
        },
        {
          name: `${departmentLabel} Members`,
          members: Math.max(0, memberCount - teamLeadCount),
          description: 'Active contributors in the department.',
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage admin roles, enforce access policies, and review invitations.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Invite teammate
        </button>
      </header>

      {teamData ? (
        <section className="grid gap-4">
          {teams.map((team) => (
            <article
              key={team.name}
              className="rounded-lg border border-border bg-background/80 p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{team.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {team.description}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-dashed border-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {team.members} members
                </span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-border bg-background/80 p-6 text-sm text-muted-foreground">
          Team data is unavailable right now. Refresh to try again.
        </section>
      )}
    </div>
  );
}
