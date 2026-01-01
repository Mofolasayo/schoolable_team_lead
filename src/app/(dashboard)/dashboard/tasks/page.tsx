'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    CheckSquare,
    Plus,
    Clock,
    AlertCircle,
    MoreHorizontal,
    Search,
    Filter,
    Calendar,
    ArrowRight,
    Wifi,
    X,
    Paperclip,
    ListTodo,
    MessageSquare,
    Loader2
} from 'lucide-react';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { getTeamTasks, getTeamMembers, createTask, Task, TeamMember } from '@/lib/api/team-lead';
import { toast } from 'sonner';

interface DisplayTask {
    id: string;
    title: string;
    description: string | null;
    assignee: { id: string; name: string; avatar: string; department: string };
    priority: string;
    priorityColor: string;
    status: string;
    statusColor: string;
    dueDate: string | null;
    tag: string | null;
    created: string;
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

function getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
        case 'completed':
        case 'done':
            return 'bg-emerald-100 text-emerald-700';
        case 'in progress':
            return 'bg-indigo-100 text-indigo-700';
        default:
            return 'bg-slate-100 text-slate-700';
    }
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<DisplayTask[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<DisplayTask | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignee_id: '',
        priority: 'Medium',
        due_date: '',
        category: '',
    });

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [tasksData, membersData] = await Promise.all([
                    getTeamTasks(),
                    getTeamMembers(false) // Exclude self for assignment
                ]);

                // Transform tasks for display
                const displayTasks: DisplayTask[] = tasksData.map((task: Task) => {
                    const assignee = membersData.members.find(m => m.id === task.assignee_id);
                    return {
                        id: task.id,
                        title: task.title,
                        description: task.description,
                        assignee: {
                            id: task.assignee_id,
                            name: assignee?.full_name || task.assignee_name || 'Unassigned',
                            avatar: assignee?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee_id}`,
                            department: assignee?.department || 'Unknown'
                        },
                        priority: task.priority,
                        priorityColor: getPriorityColor(task.priority),
                        status: task.status,
                        statusColor: getStatusColor(task.status),
                        dueDate: task.due_date,
                        tag: task.category,
                        created: task.created_at,
                    };
                });

                setTasks(displayTasks);
                setTeamMembers(membersData.members);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load tasks');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateTask = async () => {
        if (!newTask.title || !newTask.assignee_id) {
            toast.error('Please fill in title and assignee');
            return;
        }

        try {
            setIsCreating(true);
            const created = await createTask({
                title: newTask.title,
                description: newTask.description || undefined,
                assignee_id: newTask.assignee_id,
                priority: newTask.priority,
                due_date: newTask.due_date || undefined,
                category: newTask.category || undefined,
            });

            const assignee = teamMembers.find(m => m.id === created.assignee_id);
            const displayTask: DisplayTask = {
                id: created.id,
                title: created.title,
                description: created.description,
                assignee: {
                    id: created.assignee_id,
                    name: assignee?.full_name || 'Assigned',
                    avatar: assignee?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${created.assignee_id}`,
                    department: assignee?.department || 'Unknown'
                },
                priority: created.priority,
                priorityColor: getPriorityColor(created.priority),
                status: created.status,
                statusColor: getStatusColor(created.status),
                dueDate: created.due_date,
                tag: created.category,
                created: created.created_at,
            };

            setTasks([displayTask, ...tasks]);
            setIsCreateModalOpen(false);
            setNewTask({ title: '', description: '', assignee_id: '', priority: 'Medium', due_date: '', category: '' });
            toast.success('Task created successfully');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to create task');
        } finally {
            setIsCreating(false);
        }
    };

    // Calculate metrics
    const todoCount = tasks.filter(t => t.status === 'Pending' || t.status === 'To Do').length;
    const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
    const highPriorityCount = tasks.filter(t => t.priority === 'High' || t.priority === 'Critical').length;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-500">Loading tasks...</p>
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
                    <h3 className="text-lg font-semibold text-slate-900">Failed to Load Tasks</h3>
                    <p className="text-sm text-slate-500">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Tasks</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage assignments and deliverables within the team.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search tasks..." className="pl-9 w-64 h-9 text-sm bg-white" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Wifi className="h-3 w-3" /> Live
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Task
                    </Button>
                </div>
            </div>

            {/* Metrics Quick View */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500">To Do</p>
                            <p className="text-2xl font-bold text-slate-900">{todoCount}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <CheckSquare className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500">In Progress</p>
                            <p className="text-2xl font-bold text-indigo-600">{inProgressCount}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-slate-500">High Priority</p>
                            <p className="text-2xl font-bold text-rose-600">{highPriorityCount}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm bg-indigo-600 text-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-indigo-100">Total Tasks</p>
                            <p className="text-2xl font-bold text-white">{tasks.length}</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Task List */}
            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold text-slate-900">Active Assignments</CardTitle>
                        <Badge variant="secondary" className="bg-slate-200 text-slate-600 font-normal border-0">Team only</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-slate-500 hover:text-indigo-600">
                        <Filter className="h-4 w-4" /> Filter
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-500">No tasks found. Create your first task!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 w-[40%]">Task Details</th>
                                        <th className="px-6 py-3">Assignee</th>
                                        <th className="px-6 py-3">Priority</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Due Date</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tasks.map((task) => (
                                        <tr
                                            key={task.id}
                                            onClick={() => setSelectedTask(task)}
                                            className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900 group-hover:text-indigo-700 transition-colors">{task.title}</div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] text-slate-400 font-mono">{task.id.slice(0, 8)}</span>
                                                    {task.tag && (
                                                        <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 text-slate-500 font-normal bg-slate-50">
                                                            {task.tag}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6 ring-2 ring-white">
                                                        <AvatarImage src={task.assignee.avatar} />
                                                        <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-slate-600 font-medium">{task.assignee.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`font-medium border-0 px-2 py-0.5 ${task.priorityColor}`}>
                                                    {task.priority}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${task.status === 'Done' || task.status === 'Completed' ? 'bg-emerald-500' :
                                                        task.status === 'In Progress' ? 'bg-indigo-500' :
                                                            'bg-slate-300'
                                                        }`} />
                                                    <span className="text-slate-600">{task.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Task Modal */}
            <CustomDialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                title="Create Team Task"
                description="Assign a new task to a team member."
                className="max-w-2xl"
            >
                <div className="grid gap-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Task Title</Label>
                            <Input
                                placeholder="e.g. Update API documentation"
                                value={newTask.title}
                                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                className="h-10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">Description</Label>
                            <textarea
                                className="w-full min-h-[100px] p-3 rounded-md border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Describe the task details..."
                                value={newTask.description}
                                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Assignee</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newTask.assignee_id}
                                    onChange={(e) => setNewTask({ ...newTask, assignee_id: e.target.value })}
                                >
                                    <option value="">Select team member</option>
                                    {teamMembers.filter(m => !m.is_team_lead).map(staff => (
                                        <option key={staff.id} value={staff.id}>{staff.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Due Date</Label>
                                <Input
                                    type="date"
                                    value={newTask.due_date}
                                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Priority</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Category (Optional)</Label>
                                <Input
                                    placeholder="e.g. Bug Fix"
                                    value={newTask.category}
                                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
                    <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleCreateTask}
                        disabled={isCreating}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Task'
                        )}
                    </Button>
                </div>
            </CustomDialog>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-white">{selectedTask.id.slice(0, 8)}</Badge>
                                <div className="h-4 w-px bg-slate-300 mx-1" />
                                <span className="text-sm text-slate-500 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Created {new Date(selectedTask.created).toLocaleDateString()}
                                </span>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-slate-900 leading-tight">{selectedTask.title}</h2>
                                    <div className="flex gap-2">
                                        <Badge className={selectedTask.statusColor}>{selectedTask.status}</Badge>
                                        <Badge className={selectedTask.priorityColor}>{selectedTask.priority}</Badge>
                                    </div>
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                    {selectedTask.description || 'No description provided.'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Assignee</h4>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                            <AvatarImage src={selectedTask.assignee.avatar} />
                                            <AvatarFallback>{selectedTask.assignee.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{selectedTask.assignee.name}</p>
                                            <p className="text-xs text-slate-500">{selectedTask.assignee.department}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Timeline</h4>
                                    <div className="flex items-center gap-2 text-sm text-slate-700">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        <span>Due on <span className="font-semibold">
                                            {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'No due date'}
                                        </span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
