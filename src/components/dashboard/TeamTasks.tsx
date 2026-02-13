'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { getTeamTasks, Task } from '@/lib/api/team-lead';

function formatDueDate(dueDate: string | null | undefined): string {
  if (!dueDate) return 'No due date';
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 'No due date';
  const now = new Date();
  const diff = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return `${Math.abs(diff)} days overdue`;
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `In ${diff} days`;
}

function normalizeStatus(status: string | null | undefined): string {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'done' || normalized === 'completed') return 'Completed';
  if (normalized === 'in_progress' || normalized === 'in progress')
    return 'In Progress';
  if (normalized === 'review') return 'Review';
  if (normalized === 'cancelled' || normalized === 'canceled')
    return 'Cancelled';
  return 'Pending';
}

export function TeamTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await getTeamTasks();
        setTasks(data);
      } catch (err) {
        console.error('Failed to load team tasks:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-medium">Team Tasks & Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No tasks available.
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const statusLabel = normalizeStatus(task.status);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-normal leading-none">
                      {task.title}
                    </p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="mr-2 font-semibold">
                        {task.assignee_name || 'Unassigned'}
                      </span>
                      <span className="mx-1">•</span>
                      <span>Due {formatDueDate(task.due_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.priority?.toLowerCase() === 'critical'
                          ? 'destructive'
                          : task.priority?.toLowerCase() === 'high'
                            ? 'default'
                            : 'secondary'
                      }
                      className="hidden sm:inline-flex"
                    >
                      {task.priority || 'Medium'}
                    </Badge>
                    {statusLabel === 'Completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : statusLabel === 'In Progress' ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
