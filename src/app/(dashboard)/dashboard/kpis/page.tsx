'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Target,
    TrendingUp,
    Trash2,
    Edit3,
    X,
    Loader2,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getMyKpis,
    createKpi,
    updateKpi,
    deleteKpi,
    submitKpiProgress,
    getKpiProgress,
    type TeamKpi,
    type KpiCreateRequest,
    type KpiUpdateRequest,
    type KpiProgressItem,
    type WeeklyKpiProgress,
} from '@/lib/api/team-lead';

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

function getCurrentQuarter(): Quarter {
    const month = new Date().getMonth() + 1;
    if (month <= 3) return 'Q1';
    if (month <= 6) return 'Q2';
    if (month <= 9) return 'Q3';
    return 'Q4';
}

function getCurrentWeek(): number {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

export default function TeamKpisPage() {
    const [kpis, setKpis] = useState<TeamKpi[]>([]);
    const [progress, setProgress] = useState<WeeklyKpiProgress[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters
    const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(getCurrentQuarter());
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [totalWeight, setTotalWeight] = useState(0);
    const [remainingWeight, setRemainingWeight] = useState(100);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [editingKpi, setEditingKpi] = useState<TeamKpi | null>(null);
    const [newKpi, setNewKpi] = useState<KpiCreateRequest>({
        name: '',
        description: '',
        targetValue: 100,
        targetUnit: 'units',
        weight: 25,
        quarter: getCurrentQuarter(),
        year: new Date().getFullYear(),
    });

    // Progress submission
    const [progressEntries, setProgressEntries] = useState<KpiProgressItem[]>([]);

    const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
    const years = [2024, 2025, 2026];

    const refreshKpis = useCallback(async () => {
        try {
            const data = await getMyKpis(selectedQuarter, selectedYear);
            setKpis(data.kpis || []);
            setTotalWeight(data.totalWeight || 0);
            setRemainingWeight(data.remainingWeight !== undefined ? data.remainingWeight : 100);

            // Get current week progress
            const progressData = await getKpiProgress(getCurrentWeek(), selectedYear);
            setProgress(progressData.progress || []);
        } catch (err) {
            console.error('Failed to load KPIs:', err);
        }
    }, [selectedQuarter, selectedYear]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                await refreshKpis();
            } catch {
                toast.error('Failed to load KPIs');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [refreshKpis]);

    // Calculate metrics
    const activeKpis = kpis.filter(k => k.isActive);
    const avgProgress = activeKpis.length > 0
        ? activeKpis.reduce((sum, kpi) => {
            const kpiProgress = progress.find(p => p.kpiId === kpi.id);
            return sum + (kpiProgress?.progressPercentage || 0);
        }, 0) / activeKpis.length
        : 0;

    const summaryMetrics = [
        {
            label: 'Active KPIs',
            value: activeKpis.length.toString(),
            detail: `${selectedQuarter} ${selectedYear}`,
            icon: Target,
            color: 'text-primary',
        },
        {
            label: 'Total Weight',
            value: `${totalWeight}%`,
            detail: `${remainingWeight}% remaining`,
            icon: TrendingUp,
            color: 'text-blue-600',
        },
        {
            label: 'Avg. Progress',
            value: `${Math.round(avgProgress)}%`,
            detail: 'This quarter',
            icon: CheckCircle2,
            color: 'text-emerald-600',
        },
        {
            label: 'Status',
            value: totalWeight === 100 ? 'Complete' : 'Incomplete',
            detail: totalWeight === 100 ? 'Weights total 100%' : 'Add more KPIs',
            icon: AlertCircle,
            color: totalWeight === 100 ? 'text-emerald-600' : 'text-amber-600',
        },
    ];

    const handleCreateKpi = async () => {
        if (!newKpi.name || !newKpi.targetValue || !newKpi.weight) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (newKpi.weight > remainingWeight) {
            toast.error(`Weight cannot exceed remaining ${remainingWeight}%`);
            return;
        }

        setIsSubmitting(true);
        try {
            await createKpi({
                ...newKpi,
                quarter: selectedQuarter,
                year: selectedYear,
            });
            toast.success('KPI created successfully');
            setShowCreateModal(false);
            setNewKpi({
                name: '',
                description: '',
                targetValue: 100,
                targetUnit: 'units',
                weight: 25,
                quarter: selectedQuarter,
                year: selectedYear,
            });
            await refreshKpis();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create KPI');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateKpi = async () => {
        if (!editingKpi) return;

        setIsSubmitting(true);
        try {
            const updates: KpiUpdateRequest = {
                name: editingKpi.name,
                description: editingKpi.description,
                targetValue: editingKpi.targetValue,
                targetUnit: editingKpi.targetUnit,
                weight: editingKpi.weight,
                isActive: editingKpi.isActive,
            };
            await updateKpi(editingKpi.id, updates);
            toast.success('KPI updated successfully');
            setEditingKpi(null);
            await refreshKpis();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update KPI');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteKpi = async (kpiId: string) => {
        if (!confirm('Are you sure you want to delete this KPI?')) return;

        try {
            await deleteKpi(kpiId);
            toast.success('KPI deleted');
            await refreshKpis();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete KPI');
        }
    };

    const handleSubmitProgress = async () => {
        const validEntries = progressEntries.filter(p => p.achievedValue > 0);
        if (validEntries.length === 0) {
            toast.error('Please enter at least one progress value');
            return;
        }

        setIsSubmitting(true);
        try {
            await submitKpiProgress({
                weekNumber: getCurrentWeek(),
                year: selectedYear,
                progress: validEntries,
            });
            toast.success('Progress submitted successfully');
            setShowProgressModal(false);
            setProgressEntries([]);
            await refreshKpis();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to submit progress');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openProgressModal = () => {
        // Initialize progress entries from KPIs
        setProgressEntries(
            activeKpis.map(kpi => ({
                kpiId: kpi.id,
                achievedValue: 0,
                notes: '',
            }))
        );
        setShowProgressModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Team KPIs</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Define and track your team&apos;s key performance indicators.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={openProgressModal}
                        disabled={activeKpis.length === 0}
                        className="flex items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrendingUp className="h-3.5 w-3.5" />
                        Log Progress
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add KPI
                    </button>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {summaryMetrics.map(metric => {
                    const Icon = metric.icon;
                    return (
                        <div
                            key={metric.label}
                            className="rounded-xl border border-border/40 bg-white p-5 shadow-sm"
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                                    {metric.label}
                                </p>
                                <Icon className={`h-4 w-4 ${metric.color}`} />
                            </div>
                            <p className="mb-1 text-3xl font-normal tracking-tight text-gray-800">
                                {metric.value}
                            </p>
                            <p className="text-xs text-muted-foreground">{metric.detail}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quarter/Year Filter */}
            <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Quarter:</span>
                        <div className="flex items-center gap-1">
                            {quarters.map(q => (
                                <button
                                    key={q}
                                    onClick={() => setSelectedQuarter(q)}
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedQuarter === q
                                        ? 'bg-primary text-white'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Year:</span>
                        <select
                            value={selectedYear}
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="rounded-lg border border-border/40 bg-white px-3 py-1 text-xs outline-none focus:border-primary/40"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPIs Table */}
            <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
                <div className="border-b border-border/40 p-6">
                    <h2 className="text-sm font-normal text-gray-700">Your Team KPIs</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {selectedQuarter} {selectedYear} • Weights must total 100%
                    </p>
                </div>

                {/* KPIs List */}
                <div className="divide-y divide-border/40">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : kpis.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gray-100 p-3">
                                <Target className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">No KPIs defined</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Start by adding KPIs for {selectedQuarter} {selectedYear}.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                                >
                                    <Plus className="-ml-0.5 mr-1.5 h-4 w-4" />
                                    Add KPI
                                </button>
                            </div>
                        </div>
                    ) : (
                        kpis.map(kpi => {
                            const kpiProgress = progress.find(p => p.kpiId === kpi.id);
                            const progressPct = kpiProgress?.progressPercentage || 0;

                            return (
                                <div
                                    key={kpi.id}
                                    className="p-6 transition-colors hover:bg-muted/20"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-2 flex items-center gap-3">
                                                <h3 className="text-sm font-medium text-gray-800">
                                                    {kpi.name}
                                                </h3>
                                                {!kpi.isActive && (
                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            {kpi.description && (
                                                <p className="mb-3 text-xs text-muted-foreground">
                                                    {kpi.description}
                                                </p>
                                            )}

                                            {/* KPI Details */}
                                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Target:</span>
                                                    <span className="font-medium text-gray-700">
                                                        {kpi.targetValue} {kpi.targetUnit}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Weight:</span>
                                                    <span className="font-medium text-gray-700">{kpi.weight}%</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-muted-foreground">Progress:</span>
                                                    <span className={`font-medium ${progressPct >= 100 ? 'text-emerald-600' : progressPct >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                                                        {Math.round(progressPct)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-3">
                                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${progressPct >= 100 ? 'bg-emerald-500' : progressPct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                                                            }`}
                                                        style={{ width: `${Math.min(progressPct, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setEditingKpi(kpi)}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteKpi(kpi.id)}
                                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Weight Warning */}
                {kpis.length > 0 && totalWeight !== 100 && (
                    <div className="border-t border-border/40 bg-amber-50 px-6 py-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <p className="text-xs text-amber-700">
                                Total weight is {totalWeight}%. Please adjust KPI weights to total 100%.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create KPI Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
                        {/* Modal Header */}
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
                            <div>
                                <h3 className="text-base font-medium text-gray-800">Add New KPI</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Define a key performance indicator for {selectedQuarter} {selectedYear}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            {/* Name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    KPI Name *
                                </label>
                                <input
                                    type="text"
                                    value={newKpi.name}
                                    onChange={e => setNewKpi({ ...newKpi, name: e.target.value })}
                                    placeholder="e.g., Customer Satisfaction Score"
                                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    value={newKpi.description}
                                    onChange={e => setNewKpi({ ...newKpi, description: e.target.value })}
                                    placeholder="Describe what this KPI measures..."
                                    rows={2}
                                    className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Target Value and Unit */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Target Value *
                                    </label>
                                    <input
                                        type="number"
                                        value={newKpi.targetValue}
                                        onChange={e => setNewKpi({ ...newKpi, targetValue: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Unit
                                    </label>
                                    <input
                                        type="text"
                                        value={newKpi.targetUnit}
                                        onChange={e => setNewKpi({ ...newKpi, targetUnit: e.target.value })}
                                        placeholder="e.g., %, units, hours"
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            {/* Weight */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    Weight (%) *
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={remainingWeight}
                                    value={newKpi.weight}
                                    onChange={e => setNewKpi({ ...newKpi, weight: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Available: {remainingWeight}% • All KPI weights must total 100%
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end gap-3 border-t border-border/40 p-4">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateKpi}
                                disabled={isSubmitting}
                                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create KPI'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit KPI Modal */}
            {editingKpi && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
                            <div>
                                <h3 className="text-base font-medium text-gray-800">Edit KPI</h3>
                            </div>
                            <button
                                onClick={() => setEditingKpi(null)}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    KPI Name *
                                </label>
                                <input
                                    type="text"
                                    value={editingKpi.name}
                                    onChange={e => setEditingKpi({ ...editingKpi, name: e.target.value })}
                                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    value={editingKpi.description || ''}
                                    onChange={e => setEditingKpi({ ...editingKpi, description: e.target.value })}
                                    rows={2}
                                    className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Target Value *
                                    </label>
                                    <input
                                        type="number"
                                        value={editingKpi.targetValue}
                                        onChange={e => setEditingKpi({ ...editingKpi, targetValue: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Unit
                                    </label>
                                    <input
                                        type="text"
                                        value={editingKpi.targetUnit}
                                        onChange={e => setEditingKpi({ ...editingKpi, targetUnit: e.target.value })}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    Weight (%) *
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={editingKpi.weight}
                                    onChange={e => setEditingKpi({ ...editingKpi, weight: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={editingKpi.isActive}
                                    onChange={e => setEditingKpi({ ...editingKpi, isActive: e.target.checked })}
                                    className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isActive" className="text-sm text-gray-700">
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border/40 p-4">
                            <button
                                onClick={() => setEditingKpi(null)}
                                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateKpi}
                                disabled={isSubmitting}
                                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Modal */}
            {showProgressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
                            <div>
                                <h3 className="text-base font-medium text-gray-800">Log Weekly Progress</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Week {getCurrentWeek()} of {selectedYear}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProgressModal(false)}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto p-6">
                            {progressEntries.map((entry, index) => {
                                const kpi = activeKpis.find(k => k.id === entry.kpiId);
                                if (!kpi) return null;

                                return (
                                    <div key={kpi.id} className="rounded-lg border border-border/40 p-4">
                                        <div className="mb-3">
                                            <h4 className="text-sm font-medium text-gray-800">{kpi.name}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                Target: {kpi.targetValue} {kpi.targetUnit}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="mb-1 block text-xs text-gray-600">
                                                    Achieved this week
                                                </label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={entry.achievedValue || ''}
                                                    onChange={e => {
                                                        const newEntries = [...progressEntries];
                                                        newEntries[index] = {
                                                            ...entry,
                                                            achievedValue: Number(e.target.value),
                                                        };
                                                        setProgressEntries(newEntries);
                                                    }}
                                                    placeholder="0"
                                                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-xs text-gray-600">
                                                    Notes (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={entry.notes || ''}
                                                    onChange={e => {
                                                        const newEntries = [...progressEntries];
                                                        newEntries[index] = {
                                                            ...entry,
                                                            notes: e.target.value,
                                                        };
                                                        setProgressEntries(newEntries);
                                                    }}
                                                    placeholder="Quick note..."
                                                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border/40 p-4">
                            <button
                                onClick={() => setShowProgressModal(false)}
                                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitProgress}
                                disabled={isSubmitting}
                                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Progress'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
