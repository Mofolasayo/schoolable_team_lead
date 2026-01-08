'use client';

import { useState, useEffect } from 'react';
import {
    getTeamIndividualKpis,
    getPendingKpiSetup,
    createIndividualKpi,
    updateIndividualKpi,
    deleteIndividualKpi,
    type EmployeeKpis,
    type TeamKpisResponse,
    type PendingSetupResponse,
} from '@/lib/api/team-lead';

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
    const [pendingSetup, setPendingSetup] = useState<PendingSetupResponse | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeKpis | null>(null);
    const [showAddKpiModal, setShowAddKpiModal] = useState(false);
    const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
    const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [kpisData, pendingData] = await Promise.all([
                getTeamIndividualKpis(selectedQuarter, selectedYear),
                getPendingKpiSetup(selectedQuarter, selectedYear),
            ]);
            setTeamKpis(kpisData);
            setPendingSetup(pendingData);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Individual KPIs</h1>
                <p className="text-gray-500 mt-1">Set and manage KPIs for each team member</p>
            </div>

            {/* Period Selection */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Quarter</label>
                    <select
                        value={selectedQuarter}
                        onChange={(e) => setSelectedQuarter(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500"
                    >
                        {[2024, 2025, 2026].map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={() => setShowAddEmployeeModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Set KPIs for Employee
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
                    {error}
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {teamKpis?.employees.filter(e => e.isComplete).length || 0}
                            </p>
                            <p className="text-xs text-gray-500">Complete (100% weight)</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {pendingSetup?.pendingCount || 0}
                            </p>
                            <p className="text-xs text-gray-500">Pending Setup</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {teamKpis?.employees.length || 0}
                            </p>
                            <p className="text-xs text-gray-500">Employees with KPIs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Employees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamKpis?.employees.map((employee) => (
                    <div
                        key={employee.employeeId}
                        className="bg-white rounded-xl shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedEmployee(employee)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-primary font-semibold">
                                        {employee.employeeName?.charAt(0) || '?'}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-sm">{employee.employeeName}</h3>
                                    <p className="text-xs text-gray-500">{employee.employeeRole || 'Team Member'}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${employee.isComplete
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                                }`}>
                                {employee.totalWeight}%
                            </span>
                        </div>
                        <div className="space-y-2">
                            {employee.kpis.slice(0, 3).map((kpi) => (
                                <div key={kpi.id} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 truncate flex-1">{kpi.name}</span>
                                    <span className="text-gray-400 ml-2">{kpi.weight}%</span>
                                </div>
                            ))}
                            {employee.kpis.length > 3 && (
                                <p className="text-xs text-primary">+{employee.kpis.length - 3} more</p>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${employee.isComplete ? 'bg-green-500' : 'bg-purple-500'}`}
                                    style={{ width: `${Math.min(employee.totalWeight, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {teamKpis?.employees.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs Set Yet</h3>
                    <p className="text-gray-500 mb-6">Start by setting individual KPIs for your team members.</p>
                    <button
                        onClick={() => setShowAddEmployeeModal(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
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
}: {
    employee: EmployeeKpis;
    onClose: () => void;
    onAddKpi: () => void;
    onDeleteKpi: (kpiId: string) => void;
    onRefresh: () => void;
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-primary to-indigo-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                <span className="text-xl font-bold">
                                    {employee.employeeName?.charAt(0) || '?'}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold">{employee.employeeName}</h2>
                                <p className="text-purple-100 text-sm">{employee.employeeRole || 'Team Member'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-1">
                            <span>Total Weight</span>
                            <span className="font-semibold">{employee.totalWeight}%</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                            <div
                                className="bg-white h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(employee.totalWeight, 100)}%` }}
                            ></div>
                        </div>
                        {employee.totalWeight < 100 && (
                            <p className="text-xs text-purple-100 mt-1">
                                Need {100 - employee.totalWeight}% more weight to complete
                            </p>
                        )}
                    </div>
                </div>

                {/* KPIs List */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">KPIs</h3>
                        {employee.totalWeight < 100 && (
                            <button
                                onClick={onAddKpi}
                                className="text-sm text-primary hover:text-primary/90 font-medium flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add KPI
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {employee.kpis.map((kpi) => (
                            <div key={kpi.id} className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{kpi.name}</h4>
                                        {kpi.description && (
                                            <p className="text-sm text-gray-500 mt-1">{kpi.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-purple-100 text-primary/90 text-xs rounded-full font-medium">
                                            {kpi.weight}%
                                        </span>
                                        <button
                                            onClick={() => onDeleteKpi(kpi.id)}
                                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Target:</span>{' '}
                                        <span className="font-medium text-gray-900">
                                            {kpi.targetValue} {kpi.targetUnit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500">Current:</span>
                                        {editingKpi === kpi.id ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-20 px-2 py-1 text-sm border border-gray-200 rounded"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleUpdateCurrentValue(kpi.id)}
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setEditingKpi(null)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                                <div className="mt-2">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-gray-500">Achievement</span>
                                        <span className={`font-medium ${kpi.achievementPercentage >= 100 ? 'text-green-600' :
                                            kpi.achievementPercentage >= 50 ? 'text-amber-600' : 'text-red-500'
                                            }`}>
                                            {kpi.achievementPercentage.toFixed(0)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all ${kpi.achievementPercentage >= 100 ? 'bg-green-500' :
                                                kpi.achievementPercentage >= 50 ? 'bg-amber-500' : 'bg-red-400'
                                                }`}
                                            style={{ width: `${Math.min(kpi.achievementPercentage, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {employee.kpis.length === 0 && (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-3">No KPIs set yet</p>
                            <button
                                onClick={onAddKpi}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
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
        } catch (err: any) {
            console.error('Error creating KPI:', err);
            setError(err?.message || 'Failed to create KPI');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-md w-full"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Add KPI for {employeeName}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Remaining weight: <span className="font-medium text-primary">{maxWeight}%</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Sales Target"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Describe this KPI..."
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Target Value *</label>
                            <input
                                type="number"
                                step="0.01"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="100"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <input
                                type="text"
                                value={targetUnit}
                                onChange={(e) => setTargetUnit(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="e.g., %, tasks, hours"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight (%) *</label>
                        <input
                            type="number"
                            min="1"
                            max={maxWeight}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder={`1-${maxWeight}`}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            All KPIs for this employee should sum to 100%
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
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
}: {
    employees: { id: string; name: string; email: string; role: string | null }[];
    quarter: string;
    year: number;
    onClose: () => void;
    onSelect: (employeeId: string, employeeName: string) => void;
}) {
    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-md w-full"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Select Employee</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Choose a team member to set KPIs for {quarter} {year}
                    </p>
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">
                    {employees.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">All team members have KPIs set</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {employees.map((emp) => (
                                <button
                                    key={emp.id}
                                    onClick={() => onSelect(emp.id, emp.name)}
                                    className="w-full p-4 text-left bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-primary font-semibold">
                                                {emp.name?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{emp.name}</p>
                                            <p className="text-xs text-gray-500">{emp.role || emp.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
