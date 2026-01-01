'use client';

import { useState } from 'react';
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
    WifiOff,
    MoreVertical,
    FileText,
    Image as ImageIcon,
    Trash2,
    X,
    Paperclip,
    ListTodo,
    MessageSquare
} from 'lucide-react';
import { CustomDialog } from '@/components/ui/custom-dialog';

// Mock Data for Internal Team Tasks
const initialTasks = [
    {
        id: 'TASK-1024',
        title: 'Review PR #452 for Auth Service',
        description: 'Review the changes made to the authentication service. Ensure that the new implementation is secure and robust.',
        assignee: { name: 'Sarah Jenkins', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', department: 'Engineering' },
        priority: 'High',
        priorityColor: 'bg-rose-100 text-rose-700',
        status: 'In Progress',
        statusColor: 'bg-indigo-100 text-indigo-700',
        dueDate: 'Today',
        tag: 'Code Review',
        created: '2025-10-18',
        subtasks: [
            { id: 1, title: 'Check component structure', completed: true },
            { id: 2, title: 'Verify responsive design', completed: false }
        ],
        attachments: [
            { id: 1, name: 'auth_flow.pdf', size: '2.4 MB', type: 'pdf' }
        ],
        comments: [
            { id: 1, author: 'Marcus Cole', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', text: 'Looks good, but check line 42.', timestamp: '2025-10-18T10:00:00Z' }
        ]
    },
    {
        id: 'TASK-1025',
        title: 'Update API Documentation for v2Endpoints',
        description: 'Update the Swagger documentation to reflect the new API endpoints introduced in version 2.',
        assignee: { name: 'Marcus Cole', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', department: 'Engineering' },
        priority: 'Medium',
        priorityColor: 'bg-amber-100 text-amber-700',
        status: 'Pending',
        statusColor: 'bg-slate-100 text-slate-700',
        dueDate: 'Tomorrow',
        tag: 'Documentation',
        created: '2025-10-19',
        subtasks: [],
        attachments: [],
        comments: []
    },
    {
        id: 'TASK-1026',
        title: 'Investigate Redis connection timeout',
        description: 'We are seeing intermittent timeouts connecting to the Redis cache in production.',
        assignee: { name: 'David Kim', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', department: 'Engineering' },
        priority: 'Critical',
        priorityColor: 'bg-rose-100 text-rose-700',
        status: 'To Do',
        statusColor: 'bg-slate-100 text-slate-700',
        dueDate: 'Yesterday',
        tag: 'Bug Fix',
        created: '2025-10-17',
        subtasks: [],
        attachments: [],
        comments: []
    },
];

// Mock Staff for Assignment
const staffList = [
    { id: '1', name: 'Sarah Jenkins', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', department: 'Engineering' },
    { id: '2', name: 'Marcus Cole', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', department: 'Engineering' },
    { id: '3', name: 'David Kim', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', department: 'Engineering' },
];

export default function TasksPage() {
    const [tasks, setTasks] = useState(initialTasks);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assignee: '',
        priority: 'Medium',
        dueDate: '',
        tag: '',
    });

    const handleCreateTask = () => {
        // In a real app, you would send this to the backend
        const assignee = staffList.find(s => s.id === newTask.assignee) || staffList[0];
        const createdTask = {
            id: `TASK-${1028 + tasks.length}`,
            ...newTask,
            assignee: { name: assignee.name, avatar: assignee.avatar, department: assignee.department },
            status: 'Pending',
            statusColor: 'bg-slate-100 text-slate-700',
            priorityColor: newTask.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
            created: new Date().toISOString(),
            subtasks: [],
            attachments: [],
            comments: []
        };

        setTasks([createdTask, ...tasks]);
        setIsCreateModalOpen(false);
        setNewTask({ title: '', description: '', assignee: '', priority: 'Medium', dueDate: '', tag: '' });
    };

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internal Task Board</h1>
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
                            <p className="text-2xl font-bold text-slate-900">
                                {tasks.filter(t => t.status === 'Pending' || t.status === 'To Do').length}
                            </p>
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
                            <p className="text-2xl font-bold text-indigo-600">
                                {tasks.filter(t => t.status === 'In Progress').length}
                            </p>
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
                            <p className="text-2xl font-bold text-rose-600">
                                {tasks.filter(t => t.priority === 'High' || t.priority === 'Critical').length}
                            </p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                            <AlertCircle className="h-4 w-4" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm bg-indigo-600 text-white">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-indigo-100">Team Velocity</p>
                            <p className="text-2xl font-bold text-white">94%</p>
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
                                                <span className="text-[10px] text-slate-400 font-mono">{task.id}</span>
                                                <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 text-slate-500 font-normal bg-slate-50">
                                                    {task.tag}
                                                </Badge>
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
                                            <Badge
                                                className={`
                                                    font-medium border-0 px-2 py-0.5
                                                    ${task.priorityColor}
                                                `}
                                            >
                                                {task.priority}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${task.status === 'Done' ? 'bg-emerald-500' :
                                                        task.status === 'In Progress' ? 'bg-indigo-500' :
                                                            'bg-slate-300'
                                                    }`} />
                                                <span className="text-slate-600">{task.status}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                {task.dueDate}
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
                </CardContent>
            </Card>

            {/* Create Task Modal */}
            <CustomDialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                title="Create Internal Task"
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
                                    value={newTask.assignee}
                                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                                >
                                    <option value="">Select team member</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id}>{staff.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Due Date</Label>
                                <Input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
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
                                <Label className="text-sm font-semibold text-slate-700">Tag (Optional)</Label>
                                <Input
                                    placeholder="e.g. Bug Fix"
                                    value={newTask.tag}
                                    onChange={(e) => setNewTask({ ...newTask, tag: e.target.value })}
                                    className="h-10"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-4">
                    <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateTask} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        Create Task
                    </Button>
                </div>
            </CustomDialog>

            {/* Task Detail Modal (Similar to Dashboard) */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-white">{selectedTask.id}</Badge>
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
                                    {selectedTask.description}
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
                                        <span>Due on <span className="font-semibold">{selectedTask.dueDate}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Subtasks */}
                            {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <ListTodo className="h-4 w-4 text-slate-500" /> Subtasks
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedTask.subtasks.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                                                <input type="checkbox" checked={sub.completed} readOnly className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                                <span className={`text-sm ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{sub.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Attachments */}
                            {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-slate-500" /> Attachments
                                    </h3>
                                    <div className="flex gap-4">
                                        {selectedTask.attachments.map((file: any) => (
                                            <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors cursor-pointer group">
                                                <div className="h-8 w-8 rounded bg-red-50 text-red-600 flex items-center justify-center">
                                                    <FileText className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">{file.name}</p>
                                                    <p className="text-xs text-slate-400">{file.size}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-slate-500" /> Discussion
                                </h3>
                                <div className="space-y-6">
                                    {selectedTask.comments && selectedTask.comments.map((comment: any) => (
                                        <div key={comment.id} className="flex gap-3">
                                            <Avatar className="h-8 w-8 mt-1">
                                                <AvatarImage src={comment.avatar} />
                                                <AvatarFallback>{comment.author[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-slate-900">{comment.author}</span>
                                                    <span className="text-xs text-slate-400">2h ago</span>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-1">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {/* Comment Input */}
                                    <div className="flex gap-3 mt-4">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser" />
                                            <AvatarFallback>ME</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <textarea
                                                className="w-full h-20 p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                                placeholder="Write a comment..."
                                            />
                                            <div className="flex justify-end mt-2">
                                                <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">Post Comment</Button>
                                            </div>
                                        </div>
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
