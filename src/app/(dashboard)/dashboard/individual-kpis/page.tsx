'use client';

import { useState, useEffect } from 'react';
import {
  getTeamIndividualKpis,
  getPendingKpiSetup,
  getDashboardStats,
  getTeamMembers,
  createIndividualKpi,
  updateIndividualKpi,
  deleteIndividualKpi,
  type EmployeeKpis,
  type TeamKpisResponse,
  type PendingSetupResponse,
  type TeamMember,
} from '@/lib/api/team-lead';
import { getAvatarUrl } from '@/lib/avatar';

type MemberDirectory = Record<string, TeamMember>;

type AvatarSource = {
  employeeId?: string | null;
  employeeEmail?: string | null;
  employeeName?: string | null;
  avatar_url?: string | null;
  gender?: string | null;
};

function buildMemberDirectory(members: TeamMember[]): MemberDirectory {
  const directory: MemberDirectory = {};
  members.forEach((member) => {
    directory[String(member.id)] = member;
    if (member.employee_id) {
      directory[String(member.employee_id)] = member;
    }
    if (member.email) {
      directory[member.email.toLowerCase()] = member;
    }
  });
  return directory;
}

function resolveMemberProfile(
  directory: MemberDirectory,
  source: AvatarSource
): TeamMember | null {
  if (source.employeeId && directory[String(source.employeeId)]) {
    return directory[String(source.employeeId)];
  }
  if (source.employeeEmail) {
    const match = directory[source.employeeEmail.toLowerCase()];
    if (match) return match;
  }
  return null;
}

function resolveAvatarFromMembers(
  directory: MemberDirectory,
  source: AvatarSource
): string {
  const profile = resolveMemberProfile(directory, source);
  return getAvatarUrl({
    avatar_url: profile?.avatar_url ?? source.avatar_url ?? undefined,
    gender: profile?.gender ?? source.gender ?? undefined,
    employee_id: profile?.employee_id ?? source.employeeId ?? undefined,
    email: profile?.email ?? source.employeeEmail ?? undefined,
    full_name: profile?.full_name ?? source.employeeName ?? undefined,
    employeeName: source.employeeName ?? undefined,
  });
}

// Quarter helper
function getCurrentQuarter(): string {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
}

export default function IndividualKpisPage() {
  const [loading, setLoading] = useState(true);
  const [teamKpis, setTeamKpis] = useState<TeamKpisResponse | null>(null);
  const [pendingSetup, setPendingSetup] = useState<PendingSetupResponse | null>(
    null
  );
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeKpis | null>(
    null
  );
  const [showAddKpiModal, setShowAddKpiModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [memberDirectory, setMemberDirectory] = useState<MemberDirectory>({});
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: 3 },
    (_, index) => currentYear + index
  );
  const quarterOptions = Array.from(
    { length: 4 },
    (_, index) => `Q${index + 1}`
  );

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [kpisData, pendingData, statsData, membersData] = await Promise.all(
        [
          getTeamIndividualKpis(selectedQuarter, selectedYear),
          getPendingKpiSetup(selectedQuarter, selectedYear),
          getDashboardStats(),
          getTeamMembers(),
        ]
      );

      // Ensure Team Lead is included in the list for KPI setting if not already present
      const isLeadInKpis = kpisData.employees.some(
        (e) => e.employeeId === statsData.team_lead_id
      );
      const isLeadInPending = pendingData.employees.some(
        (e) => e.id === statsData.team_lead_id
      );

      if (!isLeadInKpis && !isLeadInPending) {
        pendingData.employees.unshift({
          id: statsData.team_lead_id,
          name: statsData.team_lead_name + ' (You)',
          email: '',
          role: 'Team Lead',
        });
        pendingData.pendingCount++;
      }

      setTeamKpis(kpisData);
      setPendingSetup(pendingData);
      setMemberDirectory(buildMemberDirectory(membersData.members));
    } catch (err) {
      console.error('Error loading KPIs:', err);
      setError('Failed to load KPI data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedQuarter, selectedYear]);

  const resolveEmployeeAvatar = (employee: EmployeeKpis) =>
    resolveAvatarFromMembers(memberDirectory, {
      employeeId: employee.employeeId,
      employeeEmail: employee.employeeEmail,
      employeeName: employee.employeeName,
      avatar_url: employee.avatar_url,
      gender: employee.gender,
    });

  const resolvePendingAvatar = (employee: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    gender?: string;
  }) =>
    resolveAvatarFromMembers(memberDirectory, {
      employeeId: employee.id,
      employeeEmail: employee.email ?? null,
      employeeName: employee.name,
      avatar_url: employee.avatar_url ?? null,
      gender: employee.gender ?? null,
    });
  const handleDeleteKpi = async (kpiId: string) => {
    if (!confirm('Are you sure you want to delete this KPI?')) return;
    try {
      await deleteIndividualKpi(kpiId);
      loadData();
    } catch (err) {
      console.error('Error deleting KPI:', err);
      alert('Failed to delete KPI');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* Header */}
      <div className="mb-6 space-y-1">
        <h1 className="text-xl font-normal text-gray-800">Individual KPIs</h1>
        <p className="text-xs text-muted-foreground">
          Set and manage KPIs for each team member
        </p>
      </div>

      {/* Period Selection & Actions */}
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Quarter</span>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="rounded-lg border border-border/40 bg-white px-2 py-1 text-sm text-gray-800 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            >
              {quarterOptions.map((quarter) => (
                <option key={quarter} value={quarter}>
                  {quarter}
                </option>
              ))}
            </select>
          </div>
          <div className="hidden h-6 w-px bg-border/40 md:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Year</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-lg border border-border/40 bg-white px-2 py-1 text-sm text-gray-800 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowAddEmployeeModal(true)}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs text-white">
            +
          </span>
          Set KPIs for Employee
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-800">
              {teamKpis?.employees.filter((e) => e.isComplete).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              Complete (100% weight)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-800">
              {pendingSetup?.pendingCount || 0}
            </p>
            <p className="text-xs text-muted-foreground">Pending setup</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-800">
              {teamKpis?.employees.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Employees with KPIs</p>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teamKpis?.employees.map((employee) => (
          <div
            key={employee.employeeId}
            className="cursor-pointer rounded-xl border border-border/40 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            onClick={() => setSelectedEmployee(employee)}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* <img
                                    src={getAvatarUrl({
                                        avatar_url: employee.avatar_url,
                                        gender: employee.gender,
                                        employee_id: employee.employeeId,
                                        full_name: employee.employeeName,
                                    })}
                                    alt={employee.employeeName}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                /> */}
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {employee.employeeName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {employee.employeeRole || 'Team Member'}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                  employee.isComplete
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {employee.totalWeight}%
              </span>
            </div>
            <div className="space-y-2">
              {employee.kpis.slice(0, 3).map((kpi) => (
                <div
                  key={kpi.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex-1 truncate text-muted-foreground">
                    {kpi.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {kpi.weight}%
                  </span>
                </div>
              ))}
              {employee.kpis.length > 3 && (
                <p className="text-xs text-primary">
                  +{employee.kpis.length - 3} more
                </p>
              )}
            </div>
            <div className="mt-4 border-t border-border/40 pt-4">
              <div className="h-1.5 w-full rounded-full bg-muted/30">
                <div
                  className={`h-1.5 rounded-full ${employee.isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                  style={{ width: `${Math.min(employee.totalWeight, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {teamKpis?.employees.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-white p-10 text-center shadow-sm">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mb-1 text-base font-medium text-gray-800">
            No KPIs set yet
          </h3>
          <p className="mb-5 text-xs text-muted-foreground">
            Start by setting individual KPIs for your team members.
          </p>
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
          >
            Set KPIs for Employee
          </button>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeKpiModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onAddKpi={() => setShowAddKpiModal(true)}
          onDeleteKpi={handleDeleteKpi}
          onRefresh={loadData}
          avatarUrl={resolveEmployeeAvatar(selectedEmployee)}
        />
      )}

      {/* Add KPI Modal */}
      {showAddKpiModal && selectedEmployee && (
        <AddKpiModal
          employeeId={selectedEmployee.employeeId}
          employeeName={selectedEmployee.employeeName}
          currentWeight={selectedEmployee.totalWeight}
          quarter={selectedQuarter}
          year={selectedYear}
          onClose={() => setShowAddKpiModal(false)}
          onSuccess={() => {
            setShowAddKpiModal(false);
            loadData();
          }}
        />
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && pendingSetup && (
        <SelectEmployeeModal
          employees={pendingSetup.employees}
          quarter={selectedQuarter}
          year={selectedYear}
          onClose={() => setShowAddEmployeeModal(false)}
          onSelect={(employeeId, employeeName) => {
            setShowAddEmployeeModal(false);
            // Create a temporary employee entry for the modal
            setSelectedEmployee({
              employeeId,
              employeeName,
              employeeEmail: null,
              employeeRole: null,
              kpis: [],
              totalWeight: 0,
              isComplete: false,
            });
            setShowAddKpiModal(true);
          }}
          resolveAvatar={resolvePendingAvatar}
        />
      )}
    </div>
  );
}

// Employee KPI Detail Modal
function EmployeeKpiModal({
  employee,
  onClose,
  onAddKpi,
  onDeleteKpi,
  onRefresh,
  avatarUrl,
}: {
  employee: EmployeeKpis;
  onClose: () => void;
  onAddKpi: () => void;
  onDeleteKpi: (kpiId: string) => void;
  onRefresh: () => void;
  avatarUrl: string;
}) {
  const [editingKpi, setEditingKpi] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleUpdateCurrentValue = async (kpiId: string) => {
    try {
      await updateIndividualKpi(kpiId, { currentValue: parseFloat(editValue) });
      setEditingKpi(null);
      onRefresh();
    } catch (err) {
      console.error('Error updating KPI:', err);
      alert('Failed to update KPI');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border/40 bg-muted/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl}
                alt={employee.employeeName}
                className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-md"
              />
              <div>
                <h2 className="text-lg font-normal leading-tight text-gray-800">
                  {employee.employeeName}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-md border border-border/40 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {employee.employeeId}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {employee.employeeRole || 'Team Member'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2.5 text-muted-foreground transition-all hover:bg-muted/40 hover:text-foreground"
              title="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="border-b border-border/40 bg-white px-6 py-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Setup progress
              </span>
              <span
                className={`text-sm font-medium ${employee.totalWeight === 100 ? 'text-emerald-600' : 'text-primary'}`}
              >
                {employee.totalWeight}%
              </span>
            </div>
            {employee.totalWeight < 100 && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                Needs {100 - employee.totalWeight}% more
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted/30">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                employee.totalWeight === 100 ? 'bg-emerald-500' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(employee.totalWeight, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* KPIs List */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-800">KPIs</h3>
            {employee.totalWeight < 100 && (
              <button
                onClick={onAddKpi}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/90"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add KPI
              </button>
            )}
          </div>

          <div className="space-y-3">
            {employee.kpis.map((kpi) => {
              const sourceLabel = kpi.progressSource
                ? kpi.progressSource
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase())
                : null;

              return (
                <div
                  key={kpi.id}
                  className="rounded-lg border border-border/40 bg-muted/20 p-4"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                      {kpi.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {kpi.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-border/40 bg-muted/40 px-2 py-1 text-xs font-medium text-muted-foreground">
                        {kpi.weight}%
                      </span>
                      <button
                        onClick={() => onDeleteKpi(kpi.id)}
                        className="p-1 text-rose-400 transition-colors hover:text-rose-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Target:</span>{' '}
                      <span className="font-medium text-gray-900">
                        {kpi.targetValue} {kpi.targetUnit}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Current:</span>
                      {editingKpi === kpi.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 rounded-md border border-border/40 bg-white px-2 py-1 text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateCurrentValue(kpi.id)}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => setEditingKpi(null)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingKpi(kpi.id);
                            setEditValue(kpi.currentValue.toString());
                          }}
                          className="font-medium text-primary hover:text-primary/90"
                        >
                          {kpi.currentValue} {kpi.targetUnit}
                        </button>
                      )}
                    </div>
                  </div>
                  {sourceLabel && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Source:{' '}
                      <span className="font-medium text-gray-700">
                        {sourceLabel}
                      </span>
                    </div>
                  )}
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Achievement</span>
                      <span
                        className={`font-medium ${
                          kpi.achievementPercentage >= 100
                            ? 'text-emerald-600'
                            : kpi.achievementPercentage >= 50
                              ? 'text-amber-600'
                              : 'text-rose-500'
                        }`}
                      >
                        {kpi.achievementPercentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/30">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          kpi.achievementPercentage >= 100
                            ? 'bg-emerald-500'
                            : kpi.achievementPercentage >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-400'
                        }`}
                        style={{
                          width: `${Math.min(kpi.achievementPercentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {employee.kpis.length === 0 && (
            <div className="py-8 text-center">
              <p className="mb-3 text-xs text-muted-foreground">
                No KPIs set yet
              </p>
              <button
                onClick={onAddKpi}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90"
              >
                Add First KPI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add KPI Modal
function AddKpiModal({
  employeeId,
  employeeName,
  currentWeight,
  quarter,
  year,
  onClose,
  onSuccess,
}: {
  employeeId: string;
  employeeName: string;
  currentWeight: number;
  quarter: string;
  year: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxWeight = 100 - currentWeight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parseInt(weight) > maxWeight) {
      setError(`Weight cannot exceed ${maxWeight}% (remaining weight)`);
      return;
    }

    setSaving(true);
    try {
      await createIndividualKpi({
        employeeId,
        name,
        description: description || undefined,
        targetValue: parseFloat(targetValue),
        targetUnit: targetUnit || undefined,
        weight: parseInt(weight),
        quarter,
        year,
      });
      onSuccess();
    } catch (err: unknown) {
      console.error('Error creating KPI:', err);
      setError(err instanceof Error ? err.message : 'Failed to create KPI');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border/40 bg-white shadow-xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="border-b border-border/40 p-6">
          <h2 className="text-lg font-normal text-gray-800">
            Add KPI for {employeeName}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Remaining weight:{' '}
            <span className="font-medium text-primary">{maxWeight}%</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              KPI Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Sales Target"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              placeholder="Describe this KPI..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Target Value *
              </label>
              <input
                type="number"
                step="0.01"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                placeholder="100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Unit
              </label>
              <input
                type="text"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                placeholder="e.g., %, tasks, hours"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Weight (%) *
            </label>
            <input
              type="number"
              min="1"
              max={maxWeight}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              placeholder={`1-${maxWeight}`}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              All KPIs for this employee should sum to 100%
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add KPI'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Select Employee Modal
function SelectEmployeeModal({
  employees,
  quarter,
  year,
  onClose,
  onSelect,
  resolveAvatar,
}: {
  employees: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    avatar_url?: string;
    gender?: string;
  }[];
  quarter: string;
  year: number;
  onClose: () => void;
  onSelect: (employeeId: string, employeeName: string) => void;
  resolveAvatar: (employee: {
    id: string;
    name: string;
    email?: string;
    avatar_url?: string;
    gender?: string;
  }) => string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-border/40 bg-white shadow-xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="border-b border-border/40 p-6">
          <h2 className="text-lg font-normal text-gray-800">Select Employee</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose a team member to set KPIs for {quarter} {year}
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto p-4">
          {employees.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted-foreground">
                All team members have KPIs set
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => onSelect(emp.id, emp.name)}
                  className="w-full rounded-lg border border-border/40 bg-white p-4 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={resolveAvatar(emp)}
                      alt={emp.name}
                      className="h-8 w-8 rounded-full object-cover shadow-sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {emp.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {emp.role || emp.email}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/40 p-4">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
