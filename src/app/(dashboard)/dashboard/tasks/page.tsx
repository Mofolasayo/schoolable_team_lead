'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Search,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    X,
    Calendar,
    Tag,
    Trash2,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    getTeamTasks,
    getTeamMembers,
    createTask,
    updateTaskStatus,
    deleteTask,
    getDashboardStats,
    Task,
    TeamMember,
} from '@/lib/api/team-lead';

type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

type DisplayTask = {
    id: string;
    title: string;
    description: string | null;
    assignee: {
        id: string;
        name: string;
        avatar: string;
        department: string;
    };
    status: TaskStatus;
    statusColor: string;
    priority: TaskPriority;
    priorityColor: string;
    dueDate: string | null;
    dueIn: string;
    tags: string[];
    created: string;
    progress: number;
};

function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'done':
            return 'bg-emerald-100 text-emerald-700';
        case 'in progress':
            return 'bg-blue-100 text-blue-700';
        case 'overdue':
            return 'bg-red-100 text-red-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
}

function getPriorityColor(priority: string): string {
    switch (priority?.toLowerCase()) {
        case 'high':
        case 'critical':
            return 'bg-rose-100 text-rose-700';
        case 'medium':
            return 'bg-amber-100 text-amber-700';
        case 'low':
            return 'bg-emerald-100 text-emerald-700';
        default:
            return 'bg-slate-100 text-slate-700';
    }
}

function getDueIn(dueDate: string | null): string {
    if (!dueDate) return 'No due date';
    const due = new Date(dueDate);
    const now = new Date();
    const diff = due.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `Due in ${days} days`;
}

function getProgress(status: string): number {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'done':
            return 100;
        case 'in progress':
            return 50;
        default:
            return 0;
    }
}

export default function TaskManagementPage() {
    const [taskList, setTaskList] = useState<DisplayTask[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [department, setDepartment] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filters
    const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'All'>('All');
    const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'All'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigneeId: '',
        priority: 'Medium' as TaskPriority,
        dueDate: '',
        tags: '' as string,
    });

    const recordsPerPage = 5;
    const statusFilters: (TaskStatus | 'All')[] = ['All', 'Pending', 'In Progress', 'Completed', 'Overdue'];
    const priorityFilters: (TaskPriority | 'All')[] = ['All', 'High', 'Medium', 'Low'];

    const refreshTasks = useCallback(async () => {
        try {
            const [tasksData, membersData, statsData] = await Promise.all([
                getTeamTasks(),
                getTeamMembers(true),
                getDashboardStats(),
            ]);

            setDepartment(statsData.department);

            const displayTasks: DisplayTask[] = tasksData.map((task: Task) => {
                const assignee = membersData.members.find(m => m.id === task.assignee_id);
                const status = task.status as TaskStatus;
                return {
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    assignee: {
                        id: task.assignee_id,
                        name: assignee?.full_name || task.assignee_name || 'Unassigned',
                        avatar: assignee?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee_id}`,
                        department: assignee?.department || 'Unknown',
                    },
                    status,
                    statusColor: getStatusColor(status),
                    priority: task.priority as TaskPriority,
                    priorityColor: getPriorityColor(task.priority),
                    dueDate: task.due_date,
                    dueIn: getDueIn(task.due_date),
                    tags: task.category ? [task.category] : [],
                    created: task.created_at,
                    progress: getProgress(status),
                };
            });

            setTaskList(displayTasks);
            setTeamMembers(membersData.members);
        } catch (err) {
            console.error('Failed to refresh tasks:', err);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                await refreshTasks();
            } catch {
                toast.error('Failed to load tasks');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [refreshTasks]);

    // Calculate metrics
    const totalTasks = taskList.length;
    const inProgress = taskList.filter(t => t.status === 'In Progress').length;
    const completed = taskList.filter(t => t.status === 'Completed').length;
    const overdue = taskList.filter(t => t.status === 'Overdue').length;

    const summaryMetrics = [
        {
            label: 'Total Tasks',
            value: totalTasks.toString(),
            detail: 'Team assignments',
            icon: Clock,
            color: 'text-primary',
        },
        {
            label: 'In Progress',
            value: inProgress.toString(),
            detail: `${totalTasks > 0 ? Math.round((inProgress / totalTasks) * 100) : 0}% of total`,
            icon: Clock,
            color: 'text-blue-600',
        },
        {
            label: 'Completed',
            value: completed.toString(),
            detail: `${totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0}% completion`,
            icon: CheckCircle2,
            color: 'text-emerald-600',
        },
        {
            label: 'Overdue',
            value: overdue.toString(),
            detail: 'Needs attention',
            icon: AlertCircle,
            color: 'text-red-600',
        },
    ];

    const filteredTasks = taskList.filter(task => {
        const matchesStatus = selectedStatus === 'All' || task.status === selectedStatus;
        const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
        const matchesSearch =
            searchQuery === '' ||
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        return matchesStatus && matchesPriority && matchesSearch;
    });

    const currentTasks = filteredTasks.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    const selectedTask = selectedTaskId ? taskList.find(t => t.id === selectedTaskId) : null;

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.assigneeId) {
            toast.error('Please fill in title and assignee');
            return;
        }

        if (!department) {
            toast.error('Department not found. Please refresh the page.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createTask({
                title: newTask.title,
                description: newTask.description || undefined,
                assigneeId: newTask.assigneeId,
                organization: department, // Use logged-in user's department
                priority: newTask.priority,
                dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : undefined,
                tags: newTask.tags ? [newTask.tags] : undefined,
            });

            toast.success('Task created successfully');
            setShowCreateModal(false);
            setNewTask({
                title: '',
                description: '',
                assigneeId: '',
                priority: 'Medium',
                dueDate: '',
                tags: '',
            });
            await refreshTasks();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (taskId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
        try {
            await updateTaskStatus(taskId, newStatus);
            await refreshTasks();
            toast.success(`Task marked as ${newStatus.toLowerCase()}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return;

        setIsDeleting(true);
        try {
            await deleteTask(taskId);
            toast.success('Task deleted');
            setSelectedTaskId(null);
            await refreshTasks();
        } catch {
            toast.error('Failed to delete task');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Task Management</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Track and assign tasks within {department || 'your team'}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New Task
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

            {/* Filters and Search */}
            <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Search */}
                    <div className="max-w-md flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="search"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Status:</span>
                            <div className="flex items-center gap-1">
                                {statusFilters.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setSelectedStatus(status)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedStatus === status
                                            ? 'bg-primary text-white'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground">Priority:</span>
                            <div className="flex items-center gap-1">
                                {priorityFilters.map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => setSelectedPriority(priority)}
                                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedPriority === priority
                                            ? 'bg-primary text-white'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                            }`}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="overflow-hidden rounded-xl border border-border/40 bg-white shadow-sm">
                <div className="border-b border-border/40 p-6">
                    <h2 className="text-sm font-normal text-gray-700">Team Tasks</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Manage and track task progress for {department || 'your team'}.
                    </p>
                </div>

                {/* Tasks List */}
                <div className="divide-y divide-border/40">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : currentTasks.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gray-100 p-3">
                                <Clock className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">No tasks found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchQuery || selectedStatus !== 'All'
                                    ? 'No tasks match your filters.'
                                    : "You haven't created any tasks yet."}
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
                                >
                                    <Plus className="-ml-0.5 mr-1.5 h-4 w-4" />
                                    New Task
                                </button>
                            </div>
                        </div>
                    ) : (
                        currentTasks.map(task => (
                            <div
                                key={task.id}
                                className="cursor-pointer p-6 transition-colors hover:bg-muted/20"
                                onClick={() => setSelectedTaskId(task.id)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-3 flex items-start gap-4">
                                            <div className="flex-shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={task.status === 'Completed'}
                                                    onChange={e => {
                                                        e.stopPropagation();
                                                        handleToggleStatus(task.id, task.status);
                                                    }}
                                                    className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary"
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="mb-2 flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="mb-1 text-sm font-medium text-gray-800">
                                                            {task.title}
                                                        </h3>
                                                        <p className="line-clamp-2 text-xs text-muted-foreground">
                                                            {task.description || 'No description'}
                                                        </p>
                                                    </div>
                                                    <button className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                {/* Tags */}
                                                {task.tags.length > 0 && (
                                                    <div className="mb-3 flex flex-wrap items-center gap-2">
                                                        {task.tags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Task Meta */}
                                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                                    {/* Assignee */}
                                                    <div className="flex items-center gap-2">
                                                        <img
                                                            src={task.assignee.avatar}
                                                            alt={task.assignee.name}
                                                            className="h-5 w-5 rounded-full ring-2 ring-white"
                                                        />
                                                        <span className="text-gray-700">{task.assignee.name}</span>
                                                    </div>

                                                    {/* Status and Priority */}
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${task.statusColor}`}
                                                        >
                                                            {task.status}
                                                        </span>
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${task.priorityColor}`}
                                                        >
                                                            {task.priority}
                                                        </span>
                                                    </div>

                                                    {/* Due Date */}
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        <span
                                                            className={`${task.dueIn.includes('overdue')
                                                                ? 'text-red-600'
                                                                : 'text-muted-foreground'
                                                                }`}
                                                        >
                                                            {task.dueIn}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                {task.status === 'In Progress' && (
                                                    <div className="mt-3">
                                                        <div className="mb-1 flex items-center justify-between">
                                                            <span className="text-[10px] text-muted-foreground">Progress</span>
                                                            <span className="text-[10px] font-medium text-gray-700">
                                                                {task.progress}%
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-primary transition-all"
                                                                style={{ width: `${task.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {filteredTasks.length > 0 && (
                    <div className="flex items-center justify-between border-t border-border/40 px-6 py-4">
                        <p className="text-xs text-muted-foreground">
                            Showing {(currentPage - 1) * recordsPerPage + 1}-
                            {Math.min(currentPage * recordsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage * recordsPerPage >= filteredTasks.length}
                                className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Task Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
                        {/* Modal Header */}
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
                            <div>
                                <h3 className="text-base font-medium text-gray-800">Create New Task</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Assign and track tasks within your team.
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
                            {/* Title */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    value={newTask.title}
                                    onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Enter task title"
                                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    value={newTask.description}
                                    onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                    placeholder="Enter task description"
                                    rows={4}
                                    className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            {/* Assignee and Priority */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Assignee *
                                    </label>
                                    <select
                                        value={newTask.assigneeId}
                                        onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="">Select assignee</option>
                                        {teamMembers.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {member.full_name} {member.is_team_lead && '(You)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Priority
                                    </label>
                                    <select
                                        value={newTask.priority}
                                        onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                            </div>

                            {/* Due Date and Tags */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-gray-700">
                                        Tag
                                    </label>
                                    <input
                                        type="text"
                                        value={newTask.tags}
                                        onChange={e => setNewTask({ ...newTask, tags: e.target.value })}
                                        placeholder="e.g., Bug Fix, Feature"
                                        className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
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
                                onClick={handleCreateTask}
                                disabled={isSubmitting}
                                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Task'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
                        {/* Modal Header */}
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
                            <div className="flex items-center gap-3">
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${selectedTask.statusColor}`}
                                >
                                    {selectedTask.status}
                                </span>
                                <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${selectedTask.priorityColor}`}
                                >
                                    {selectedTask.priority}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedTaskId(null)}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <h2 className="mb-2 text-xl font-medium text-gray-800">{selectedTask.title}</h2>
                            <p className="mb-6 text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedTask.description || 'No description provided.'}
                            </p>

                            <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4 text-xs">
                                <div>
                                    <p className="mb-1 text-muted-foreground">Assignee</p>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={selectedTask.assignee.avatar}
                                            alt={selectedTask.assignee.name}
                                            className="h-6 w-6 rounded-full"
                                        />
                                        <span className="font-medium text-gray-800">{selectedTask.assignee.name}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-1 text-muted-foreground">Due Date</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span className="font-medium text-gray-800">
                                            {selectedTask.dueDate
                                                ? new Date(selectedTask.dueDate).toLocaleDateString()
                                                : 'No due date'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-1 text-muted-foreground">Created</p>
                                    <span className="font-medium text-gray-800">
                                        {new Date(selectedTask.created).toLocaleDateString()}
                                    </span>
                                </div>
                                {selectedTask.tags.length > 0 && (
                                    <div>
                                        <p className="mb-1 text-muted-foreground">Category</p>
                                        <div className="flex items-center gap-1">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span className="font-medium text-gray-800">{selectedTask.tags.join(', ')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-between gap-3 border-t border-border/40 p-4">
                            <button
                                onClick={() => handleDeleteTask(selectedTask.id)}
                                disabled={isDeleting}
                                className="flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleToggleStatus(selectedTask.id, selectedTask.status)}
                                    className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                                >
                                    Mark as {selectedTask.status === 'Completed' ? 'Pending' : 'Completed'}
                                </button>
                                <button
                                    onClick={() => setSelectedTaskId(null)}
                                    className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
