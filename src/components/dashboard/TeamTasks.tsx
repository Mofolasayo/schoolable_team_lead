'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const tasks = [
    {
        id: 1,
        title: 'Update API Documentation',
        assignee: 'Alice Johnson',
        status: 'In Progress',
        priority: 'High',
        dueDate: 'Today',
    },
    {
        id: 2,
        title: 'Fix Login Bug',
        assignee: 'Bob Smith',
        status: 'Pending',
        priority: 'Critical',
        dueDate: 'Yesterday',
    },
    {
        id: 3,
        title: 'Design New Landing Page',
        assignee: 'Charlie Brown',
        status: 'Completed',
        priority: 'Medium',
        dueDate: '2 days ago',
    },
    {
        id: 4,
        title: 'Write Unit Tests',
        assignee: 'Alice Johnson',
        status: 'In Progress',
        priority: 'Low',
        dueDate: 'Tomorrow',
    },
];

export function TeamTasks() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="font-medium">Team Tasks & Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                            <div className="space-y-1">
                                <p className="text-sm font-normal leading-none">{task.title}</p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    <span className="font-semibold mr-2">{task.assignee}</span>
                                    <span className="mx-1">•</span>
                                    <span>Due {task.dueDate}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        task.priority === 'Critical'
                                            ? 'destructive'
                                            : task.priority === 'High'
                                                ? 'default' // Primary color might be too strong for 'High' but okay
                                                : 'secondary'
                                    }
                                    className="hidden sm:inline-flex"
                                >
                                    {task.priority}
                                </Badge>
                                {task.status === 'Completed' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : task.status === 'In Progress' ? (
                                    <Clock className="h-5 w-5 text-blue-500" />
                                ) : (
                                    <Circle className="h-5 w-5 text-gray-400" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
