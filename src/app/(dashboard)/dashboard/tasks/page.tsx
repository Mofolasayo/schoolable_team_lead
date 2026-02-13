'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Repeat,
  X,
  Calendar,
  User,
  BarChart3,
  Tag,
  Trash2,
  Loader2,
  MessageSquare,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Pencil,
  ListTodo,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getTeamTasks,
  getTeamMembers,
  createTask,
  updateTaskStatus,
  updateTaskDescription,
  createTaskComment,
  deleteTask,
  getDashboardStats,
  getTasksPendingRating,
  getReferenceData,
  createRecurringTaskTemplate,
  type ReferenceData,
  Task,
  TeamMember,
  type PendingRating,
} from '@/lib/api/team-lead';
import { TaskRatingPrompt } from '@/components/TaskRatingModal';
import { getAvatarUrl } from '@/lib/avatar';

type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED';
type TaskStatusFilter = TaskStatus | 'Overdue' | 'All';
type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

type TaskAttachment = {
  id: number;
  name: string;
  size: string;
  type: string;
  url: string;
};

type TaskComment = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
};

type TaskSubtask = {
  id: number;
  title: string;
  completed: boolean;
};

type NewSubtask = {
  title: string;
};

type NewAttachment = File;

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
  assignees?: {
    id: string;
    name: string;
    avatar: string;
    department: string;
    role?: string | null;
  }[];
  status: TaskStatus;
  statusLabel: string;
  statusColor: string;
  isOverdue: boolean;
  priority: TaskPriority;
  priorityColor: string;
  dueDate: string | null;
  dueIn: string;
  tags: string[];
  created: string;
  progress: number;
  organization?: string | null;
  dueTime?: string | null;
  recurringTemplateId?: string | null;
  isRecurringInstance?: boolean | null;
  subtasks: TaskSubtask[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
};

function isTaskOverdue(task: {
  dueDate: string | null;
  status: TaskStatus;
}): boolean {
  if (!task.dueDate) return false;
  const due = new Date(task.dueDate);
  return (
    due.getTime() < Date.now() &&
    task.status !== 'DONE' &&
    task.status !== 'CANCELLED'
  );
}

function getStatusColor(status: TaskStatus, isOverdue: boolean): string {
  if (isOverdue) return 'bg-red-100 text-red-700';
  switch (status) {
    case 'DONE':
      return 'bg-emerald-100 text-emerald-700';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-700';
    case 'REVIEW':
      return 'bg-amber-100 text-amber-700';
    case 'CANCELLED':
      return 'bg-gray-200 text-gray-600';
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

function getProgress(status: TaskStatus): number {
  switch (status) {
    case 'DONE':
      return 100;
    case 'REVIEW':
      return 80;
    case 'IN_PROGRESS':
      return 50;
    default:
      return 0;
  }
}

const recurrencePatterns = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
];

const weekdayOptions = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function parseLocalDate(dateValue: string): Date {
  return new Date(`${dateValue}T00:00:00`);
}

function getWeekdayValue(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function clampDayOfMonth(year: number, monthIndex: number, day: number): Date {
  const maxDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), maxDay);
  return new Date(year, monthIndex, safeDay);
}

function computeNextOccurrence(
  pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  startDate: Date,
  recurrenceDays: number[],
  recurrenceDay?: number
): Date {
  if (pattern === 'daily') {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (pattern === 'monthly') {
    const targetDay = recurrenceDay ?? startDate.getDate();
    const nextMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      1
    );
    return clampDayOfMonth(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      targetDay
    );
  }

  const days =
    recurrenceDays.length > 0
      ? recurrenceDays
      : [recurrenceDay ?? getWeekdayValue(startDate)];
  const searchStart = new Date(startDate);
  searchStart.setDate(searchStart.getDate() + 1);

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(searchStart);
    candidate.setDate(searchStart.getDate() + offset);
    if (days.includes(getWeekdayValue(candidate))) {
      if (pattern === 'biweekly') {
        const biweekly = new Date(candidate);
        biweekly.setDate(candidate.getDate() + 7);
        return biweekly;
      }
      return candidate;
    }
  }

  const fallback = new Date(searchStart);
  fallback.setDate(searchStart.getDate() + 7);
  return pattern === 'biweekly'
    ? new Date(
        fallback.getFullYear(),
        fallback.getMonth(),
        fallback.getDate() + 7
      )
    : fallback;
}

export default function TaskManagementPage() {
  const [taskList, setTaskList] = useState<DisplayTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [department, setDepartment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingRatings, setPendingRatings] = useState<PendingRating[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<TaskStatusFilter>('All');
  const [selectedPriority, setSelectedPriority] = useState<
    TaskPriority | 'All'
  >('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigneeId: '',
    assigneeIds: [] as string[],
    priority: 'Medium' as TaskPriority,
    dueDate: '',
    dueTime: '',
    tags: [] as string[],
    subtasks: [] as NewSubtask[],
    attachments: [] as NewAttachment[],
    initialComment: '',
    isRecurring: false,
    recurrencePattern: 'weekly' as 'daily' | 'weekly' | 'biweekly' | 'monthly',
    recurrenceStartDate: '',
    recurrenceDays: [] as number[],
    daysUntilDue: 1,
  });
  const [customTag, setCustomTag] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionText, setEditDescriptionText] = useState('');
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    avatar: string;
  } | null>(null);

  const toggleAssignee = (assigneeId: string) => {
    setNewTask((prev) => {
      const exists = prev.assigneeIds.includes(assigneeId);
      const nextIds = exists
        ? prev.assigneeIds.filter((id) => id !== assigneeId)
        : [...prev.assigneeIds, assigneeId];
      return {
        ...prev,
        assigneeIds: nextIds,
        assigneeId: nextIds[0] || '',
      };
    });
  };

  const recordsPerPage = 5;
  const statusFilters = referenceData?.taskStatusFilters ?? [];
  const priorityFilters = referenceData?.taskPriorityFilters ?? [];
  const taskPriorities = referenceData?.taskPriorities ?? [];
  const statusLabelsByValue = new Map(
    statusFilters.map((status) => [status.value, status.label])
  );
  const getStatusLabel = (status: TaskStatus, isOverdue: boolean): string => {
    if (isOverdue) {
      return statusLabelsByValue.get('Overdue') ?? 'Overdue';
    }
    return statusLabelsByValue.get(status) ?? status;
  };
  const getPlainStatusLabel = (status: TaskStatus): string =>
    statusLabelsByValue.get(status) ?? status;

  const availableTags = Array.from(
    new Set(taskList.flatMap((task) => task.tags || []))
  ).filter((tag) => tag && tag.trim().length > 0);

  const refreshTasks = useCallback(async () => {
    try {
      const [tasksData, membersData, statsData, ratingsData, refs] =
        await Promise.all([
          getTeamTasks(),
          getTeamMembers(true),
          getDashboardStats(),
          getTasksPendingRating(),
          getReferenceData().catch((err) => {
            console.warn('Failed to load reference data:', err);
            return null;
          }),
        ]);

      setDepartment(statsData.department);
      setPendingRatings(ratingsData.pendingRatings || []);
      if (refs) {
        setReferenceData(refs);
      }

      const displayTasks: DisplayTask[] = tasksData.map((task: Task) => {
        const assigneeMember = membersData.members.find(
          (m) => m.id === task.assignee_id
        );
        const assigneeProfile =
          task.assignee ||
          (assigneeMember
            ? {
                id: assigneeMember.id,
                full_name: assigneeMember.full_name,
                department: assigneeMember.department,
                gender: assigneeMember.gender,
                email: assigneeMember.email,
                employee_id: assigneeMember.employee_id,
                avatar_url: assigneeMember.avatar_url,
              }
            : null);
        const rawAssignees = Array.isArray(task.assignees)
          ? task.assignees
          : [];
        const mappedAssignees = rawAssignees.map((assignee) => ({
          id: assignee.id || '',
          name: assignee.full_name || 'Unassigned',
          avatar: getAvatarUrl({
            avatar_url: assignee.avatar_url,
            gender: assignee.gender,
            employee_id: assignee.employee_id,
            email: assignee.email,
            full_name: assignee.full_name,
          }),
          department: assignee.department || 'Unknown',
          role: assignee.role || null,
        }));
        const primaryFromList =
          mappedAssignees.find((assignee) => assignee.role === 'primary') ||
          mappedAssignees[0];
        const fallbackAssignee = {
          id: task.assignee_id,
          name:
            assigneeProfile?.full_name || task.assignee_name || 'Unassigned',
          avatar: getAvatarUrl({
            avatar_url: assigneeProfile?.avatar_url,
            gender: assigneeProfile?.gender,
            employee_id: assigneeProfile?.employee_id,
            email: assigneeProfile?.email,
            full_name: assigneeProfile?.full_name,
          }),
          department: assigneeProfile?.department || 'Unknown',
        };
        const primaryAssignee = primaryFromList || fallbackAssignee;
        const status = task.status as TaskStatus;
        const isOverdue = isTaskOverdue({ dueDate: task.due_date, status });
        const tags =
          Array.isArray(task.tags) && task.tags.length > 0
            ? task.tags
            : task.category
              ? [task.category]
              : [];
        const subtasks = (task.subtasks || []).map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          completed: Boolean(subtask.completed),
        }));
        const attachments = (task.attachments || []).map((attachment) => ({
          id: attachment.id,
          name: attachment.file_name || 'Attachment',
          size: attachment.file_size || '',
          type: attachment.file_type || '',
          url: attachment.file_url || '',
        }));
        const comments = (task.comments || []).map((comment) => ({
          id: comment.id,
          author: comment.author?.full_name || 'Team member',
          avatar: getAvatarUrl({
            avatar_url: comment.author?.avatar_url,
            gender: comment.author?.gender,
            employee_id: comment.author?.employee_id,
            email: comment.author?.email,
            full_name: comment.author?.full_name,
          }),
          text: comment.content || '',
          timestamp: comment.created_at || '',
        }));

        return {
          id: task.id,
          title: task.title,
          description: task.description,
          assignee: primaryAssignee,
          assignees:
            mappedAssignees.length > 0 ? mappedAssignees : [primaryAssignee],
          status,
          statusLabel: getStatusLabel(status, isOverdue),
          statusColor: getStatusColor(status, isOverdue),
          isOverdue,
          priority: task.priority as TaskPriority,
          priorityColor: getPriorityColor(task.priority),
          dueDate: task.due_date,
          dueTime: task.due_time,
          dueIn: getDueIn(task.due_date),
          tags,
          created: task.created_at,
          progress:
            typeof task.progress === 'number'
              ? task.progress
              : getProgress(status),
          organization: task.organization,
          recurringTemplateId: task.recurring_template_id,
          isRecurringInstance: task.is_recurring_instance,
          subtasks,
          attachments,
          comments,
        };
      });

      setTaskList(displayTasks);
      setTeamMembers(membersData.members);
      const leadMember =
        membersData.members.find((member) => member.is_team_lead) ??
        membersData.members[0];
      if (leadMember) {
        setCurrentUser({
          name: leadMember.full_name || 'You',
          avatar: getAvatarUrl({
            avatar_url: leadMember.avatar_url,
            gender: leadMember.gender,
            employee_id: leadMember.employee_id,
            email: leadMember.email,
            full_name: leadMember.full_name,
          }),
        });
      }
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
  const inProgress = taskList.filter((t) => t.status === 'IN_PROGRESS').length;
  const completed = taskList.filter((t) => t.status === 'DONE').length;
  const overdue = taskList.filter((t) => t.isOverdue).length;

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

  const filteredTasks = taskList.filter((task) => {
    const matchesStatus =
      selectedStatus === 'All' ||
      (selectedStatus === 'Overdue'
        ? task.isOverdue
        : task.status === selectedStatus);
    const matchesPriority =
      selectedPriority === 'All' || task.priority === selectedPriority;
    const matchesSearch =
      searchQuery === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      );

    return matchesStatus && matchesPriority && matchesSearch;
  });

  const currentTasks = filteredTasks.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const selectedTask = selectedTaskId
    ? taskList.find((t) => t.id === selectedTaskId)
    : null;
  const selectedAssignees = selectedTask
    ? selectedTask.assignees && selectedTask.assignees.length > 0
      ? selectedTask.assignees
      : [selectedTask.assignee]
    : [];

  const handleCreateTask = async () => {
    if (
      !newTask.title ||
      !newTask.description ||
      newTask.assigneeIds.length === 0
    ) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!department) {
      toast.error('Department not found. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    const primaryAssigneeId =
      newTask.assigneeId || newTask.assigneeIds[0] || '';
    try {
      const cleanedSubtasks = newTask.subtasks
        .map((subtask) => ({ title: subtask.title.trim() }))
        .filter((subtask) => subtask.title.length > 0);
      const cleanedTags = newTask.tags.map((tag) => tag.trim()).filter(Boolean);

      const uploadAttachments = async () => {
        const uploadedAttachments: {
          name: string;
          size: string;
          type: string;
          url: string;
          path?: string;
        }[] = [];
        const uploadErrors: string[] = [];
        const maxFileSize = 10 * 1024 * 1024;

        if (newTask.attachments.length === 0) {
          return { uploadedAttachments, uploadErrors };
        }

        toast.info('Uploading attachments...');

        for (const file of newTask.attachments) {
          try {
            if (file.size > maxFileSize) {
              uploadErrors.push(`${file.name}: File exceeds 10MB limit`);
              continue;
            }

            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload?folder=tasks', {
              method: 'POST',
              body: formData,
            });

            if (uploadRes.ok) {
              const result = await uploadRes.json();
              uploadedAttachments.push({
                name: file.name,
                size: file.size.toString(),
                type: file.type,
                url: result.url,
                path: result.publicId || '',
              });
            } else {
              const errorPayload = await uploadRes.json().catch(() => ({}));
              const message =
                typeof errorPayload?.error === 'string'
                  ? errorPayload.error
                  : 'Upload failed';
              uploadErrors.push(`${file.name}: ${message}`);
            }
          } catch (uploadErr) {
            console.error('Error uploading file:', file.name, uploadErr);
            uploadErrors.push(`${file.name}: Unexpected upload error`);
          }
        }

        if (uploadedAttachments.length > 0) {
          toast.success(`Uploaded ${uploadedAttachments.length} file(s)`);
        } else if (newTask.attachments.length > 0) {
          toast.warning(
            'Could not upload attachments. Creating task without them.'
          );
        }

        if (uploadErrors.length > 0) {
          toast.error(uploadErrors[0] || 'Some attachments failed to upload');
        }

        return { uploadedAttachments, uploadErrors };
      };

      if (newTask.isRecurring) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDateValue =
          newTask.recurrenceStartDate || newTask.dueDate || toDateString(today);
        const startDate = parseLocalDate(startDateValue);
        const shouldCreateNow = startDate.getTime() <= today.getTime();

        const normalizedRecurrenceDays =
          newTask.recurrencePattern === 'weekly' ||
          newTask.recurrencePattern === 'biweekly'
            ? newTask.recurrenceDays.length > 0
              ? newTask.recurrenceDays
              : [getWeekdayValue(startDate)]
            : [];

        const recurrenceDay =
          newTask.recurrencePattern === 'monthly'
            ? startDate.getDate()
            : normalizedRecurrenceDays.length === 0 &&
                newTask.recurrencePattern !== 'daily'
              ? getWeekdayValue(startDate)
              : undefined;

        const nextOccurrenceValue = shouldCreateNow
          ? toDateString(
              computeNextOccurrence(
                newTask.recurrencePattern,
                startDate,
                normalizedRecurrenceDays,
                recurrenceDay
              )
            )
          : startDateValue;

        const template = await createRecurringTaskTemplate({
          title: newTask.title,
          description: newTask.description || undefined,
          defaultPriority: newTask.priority,
          defaultAssigneeId: primaryAssigneeId,
          organization: department,
          tags: cleanedTags.length > 0 ? cleanedTags : undefined,
          recurrencePattern: newTask.recurrencePattern,
          recurrenceDay,
          recurrenceDays:
            normalizedRecurrenceDays.length > 0
              ? normalizedRecurrenceDays
              : undefined,
          dueTime: newTask.dueTime || undefined,
          daysUntilDue: newTask.daysUntilDue,
          nextOccurrence: nextOccurrenceValue,
        });

        if (!template?.id) {
          throw new Error('Recurring task created without template ID');
        }

        if (shouldCreateNow) {
          let dueDateIso: string | undefined;
          if (newTask.dueDate) {
            dueDateIso = parseLocalDate(newTask.dueDate).toISOString();
          } else if (newTask.daysUntilDue) {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + newTask.daysUntilDue);
            dueDateIso = dueDate.toISOString();
          }

          const { uploadedAttachments } = await uploadAttachments();

          const createdTask = await createTask({
            title: newTask.title,
            description: newTask.description || undefined,
            assigneeId: primaryAssigneeId,
            assigneeIds: newTask.assigneeIds,
            organization: department,
            priority: newTask.priority,
            dueDate: dueDateIso,
            dueTime: newTask.dueTime || undefined,
            tags: cleanedTags.length > 0 ? cleanedTags : undefined,
            subtasks: cleanedSubtasks.length > 0 ? cleanedSubtasks : undefined,
            attachments:
              uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
            recurringTemplateId: template.id,
            isRecurringInstance: true,
          });

          if (newTask.initialComment.trim()) {
            await createTaskComment(
              createdTask.id,
              newTask.initialComment.trim()
            );
          }
        }

        toast.success(
          shouldCreateNow
            ? 'Recurring task scheduled. First instance created.'
            : 'Recurring task scheduled.'
        );
      } else {
        const { uploadedAttachments } = await uploadAttachments();

        const createdTask = await createTask({
          title: newTask.title,
          description: newTask.description || undefined,
          assigneeId: primaryAssigneeId,
          assigneeIds: newTask.assigneeIds,
          organization: department, // Use logged-in user's department
          priority: newTask.priority,
          dueDate: newTask.dueDate
            ? new Date(newTask.dueDate).toISOString()
            : undefined,
          dueTime: newTask.dueTime || undefined,
          tags: cleanedTags.length > 0 ? cleanedTags : undefined,
          subtasks: cleanedSubtasks.length > 0 ? cleanedSubtasks : undefined,
          attachments:
            uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
        });

        if (newTask.initialComment.trim()) {
          await createTaskComment(
            createdTask.id,
            newTask.initialComment.trim()
          );
        }

        toast.success('Task created successfully');
      }

      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        assigneeId: '',
        assigneeIds: [] as string[],
        priority: 'Medium',
        dueDate: '',
        dueTime: '',
        tags: [],
        subtasks: [],
        attachments: [],
        initialComment: '',
        isRecurring: false,
        recurrencePattern: 'weekly',
        recurrenceStartDate: '',
        recurrenceDays: [],
        daysUntilDue: 1,
      });
      setCustomTag('');
      await refreshTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (
    taskId: string,
    currentStatus: TaskStatus
  ) => {
    const isCompleted = currentStatus === 'DONE';
    const newStatus: TaskStatus = isCompleted ? 'TODO' : 'DONE';
    try {
      await updateTaskStatus(taskId, newStatus);
      await refreshTasks();
      toast.success(
        `Task marked as ${getPlainStatusLabel(newStatus).toLowerCase()}`
      );
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
        {summaryMetrics.map((metric) => {
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Status:
              </span>
              <div className="flex items-center gap-1">
                {statusFilters.map((status) => (
                  <button
                    key={status.value}
                    onClick={() =>
                      setSelectedStatus(status.value as TaskStatusFilter)
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedStatus === status.value
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Priority:
              </span>
              <div className="flex items-center gap-1">
                {priorityFilters.map((priority) => (
                  <button
                    key={priority.value}
                    onClick={() =>
                      setSelectedPriority(
                        priority.value as TaskPriority | 'All'
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      selectedPriority === priority.value
                        ? 'bg-primary text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {priority.label}
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
              <h3 className="text-sm font-medium text-gray-900">
                No tasks found
              </h3>
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
            currentTasks.map((task) => (
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
                          checked={task.status === 'DONE'}
                          onChange={(e) => {
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
                            <span className="text-gray-700">
                              {task.assignee.name}
                            </span>
                          </div>

                          {/* Status and Priority */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${task.statusColor}`}
                            >
                              {task.statusLabel}
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
                              className={`${
                                task.dueIn.includes('overdue')
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {task.dueIn}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {task.status === 'IN_PROGRESS' && (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">
                                Progress
                              </span>
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
              {Math.min(currentPage * recordsPerPage, filteredTasks.length)} of{' '}
              {filteredTasks.length} tasks
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-border/40 bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
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
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
            {/* Modal Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-border/40 p-4">
              <div>
                <h3 className="text-base font-medium text-gray-800">
                  Create New Task
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Assign and track tasks across your organization.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({
                    title: '',
                    description: '',
                    assigneeId: '',
                    assigneeIds: [],
                    priority: 'Medium',
                    dueDate: '',
                    dueTime: '',
                    tags: [],
                    subtasks: [],
                    attachments: [],
                    initialComment: '',
                    isRecurring: false,
                    recurrencePattern: 'weekly',
                    recurrenceStartDate: '',
                    recurrenceDays: [],
                    daysUntilDue: 1,
                  });
                  setCustomTag('');
                }}
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
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Enter task title"
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Department and Assignees */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Department *
                  </label>
                  <select
                    value={department || ''}
                    disabled
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm text-muted-foreground outline-none transition-colors disabled:opacity-70"
                  >
                    <option value={department || ''}>
                      {department || 'No department'}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Assignees *
                  </label>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border/40 bg-white p-3 text-sm">
                    {teamMembers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No team members available.
                      </p>
                    ) : (
                      teamMembers.map((member) => {
                        const isSelected = newTask.assigneeIds.includes(
                          member.id
                        );
                        return (
                          <label
                            key={member.id}
                            className="flex items-center gap-2 text-xs text-gray-700"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAssignee(member.id)}
                              className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary/30"
                            />
                            <span className="flex-1">
                              {member.full_name}{' '}
                              {member.is_team_lead
                                ? '(You)'
                                : `(${member.department || 'Team'})`}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Priority and Due Date */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Priority *
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    {taskPriorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={newTask.dueTime}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueTime: e.target.value })
                    }
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-gray-800">
                        Recurring task
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Schedule this task to repeat automatically.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={newTask.isRecurring}
                      onChange={(e) =>
                        setNewTask({
                          ...newTask,
                          isRecurring: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary/30"
                    />
                    Enable
                  </label>
                </div>

                {newTask.isRecurring && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Pattern
                        </label>
                        <select
                          value={newTask.recurrencePattern}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              recurrencePattern: e.target.value as
                                | 'daily'
                                | 'weekly'
                                | 'biweekly'
                                | 'monthly',
                            })
                          }
                          className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        >
                          {recurrencePatterns.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Starts on
                        </label>
                        <input
                          type="date"
                          value={newTask.recurrenceStartDate}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              recurrenceStartDate: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          Days until due
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={newTask.daysUntilDue}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              daysUntilDue: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {(newTask.recurrencePattern === 'weekly' ||
                      newTask.recurrencePattern === 'biweekly') && (
                      <div>
                        <p className="mb-2 text-xs font-medium text-gray-700">
                          Repeat on
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {weekdayOptions.map((day) => {
                            const isSelected = newTask.recurrenceDays.includes(
                              day.value
                            );
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => {
                                  const updated = isSelected
                                    ? newTask.recurrenceDays.filter(
                                        (value) => value !== day.value
                                      )
                                    : [...newTask.recurrenceDays, day.value];
                                  setNewTask({
                                    ...newTask,
                                    recurrenceDays: updated,
                                  });
                                }}
                                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                  isSelected
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border/40 bg-white text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Tags
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {newTask.tags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => {
                          setNewTask({
                            ...newTask,
                            tags: newTask.tags.filter((_, i) => i !== idx),
                          });
                        }}
                        className="hover:text-primary/70"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      if (
                        e.target.value &&
                        !newTask.tags.includes(e.target.value)
                      ) {
                        setNewTask({
                          ...newTask,
                          tags: [...newTask.tags, e.target.value],
                        });
                      }
                    }}
                    className="flex-1 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Add existing tag</option>
                    {availableTags
                      .filter((tag) => !newTask.tags.includes(tag))
                      .map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                  </select>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      placeholder="Or type custom tag"
                      className="flex-1 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (
                            customTag.trim() &&
                            !newTask.tags.includes(customTag.trim())
                          ) {
                            setNewTask({
                              ...newTask,
                              tags: [...newTask.tags, customTag.trim()],
                            });
                            setCustomTag('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          customTag.trim() &&
                          !newTask.tags.includes(customTag.trim())
                        ) {
                          setNewTask({
                            ...newTask,
                            tags: [...newTask.tags, customTag.trim()],
                          });
                          setCustomTag('');
                        }
                      }}
                      disabled={!customTag.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-white text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Subtasks
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNewTask({
                        ...newTask,
                        subtasks: [...newTask.subtasks, { title: '' }],
                      })
                    }
                    className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80"
                  >
                    <Plus className="h-3 w-3" />
                    Add Subtask
                  </button>
                </div>
                <div className="space-y-2">
                  {newTask.subtasks.map((subtask, idx) => (
                    <div
                      key={`subtask-${idx}`}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) => {
                          const updated = [...newTask.subtasks];
                          updated[idx] = {
                            ...updated[idx],
                            title: e.target.value,
                          };
                          setNewTask({ ...newTask, subtasks: updated });
                        }}
                        placeholder={`Subtask ${idx + 1}`}
                        className="flex-1 rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewTask({
                            ...newTask,
                            subtasks: newTask.subtasks.filter(
                              (_, i) => i !== idx
                            ),
                          });
                        }}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {newTask.subtasks.length === 0 && (
                    <p className="text-[10px] italic text-muted-foreground">
                      No subtasks added yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Attachments
                </label>
                <div className="rounded-lg border border-dashed border-border/40 bg-gray-50/50 p-4">
                  <div className="space-y-3">
                    {newTask.attachments.length > 0 && (
                      <div className="space-y-2">
                        {newTask.attachments.map((file, idx) => (
                          <div
                            key={`${file.name}-${idx}`}
                            className="flex items-center justify-between rounded-md border border-border/40 bg-white p-2"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              {file.type.includes('image') ? (
                                <ImageIcon className="h-4 w-4 flex-shrink-0 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 flex-shrink-0 text-red-500" />
                              )}
                              <span className="truncate text-xs text-gray-700">
                                {file.name}
                              </span>
                              <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNewTask({
                                  ...newTask,
                                  attachments: newTask.attachments.filter(
                                    (_, i) => i !== idx
                                  ),
                                });
                              }}
                              className="text-muted-foreground hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-center">
                      <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border/40 bg-white px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/50 hover:text-foreground">
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Upload Files</span>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              setNewTask({
                                ...newTask,
                                attachments: [
                                  ...newTask.attachments,
                                  ...Array.from(e.target.files),
                                ],
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-border/40 p-4">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({
                    title: '',
                    description: '',
                    assigneeId: '',
                    assigneeIds: [],
                    priority: 'Medium',
                    dueDate: '',
                    dueTime: '',
                    tags: [],
                    subtasks: [],
                    attachments: [],
                    initialComment: '',
                    isRecurring: false,
                    recurrencePattern: 'weekly',
                    recurrenceStartDate: '',
                    recurrenceDays: [],
                    daysUntilDue: 1,
                  });
                  setCustomTag('');
                }}
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
              <div className="flex flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedTask.status === 'DONE'}
                  onChange={() =>
                    handleToggleStatus(selectedTask.id, selectedTask.status)
                  }
                  className="mt-1 h-4 w-4 rounded border-border/40 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <h3 className="mb-1 text-base font-medium text-gray-800">
                    {selectedTask.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${selectedTask.statusColor}`}
                    >
                      {selectedTask.statusLabel}
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${selectedTask.priorityColor}`}
                    >
                      {selectedTask.priority}
                    </span>
                    {selectedTask.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-xs font-medium text-gray-700">
                    Description
                  </h4>
                  {!isEditingDescription && (
                    <button
                      onClick={() => {
                        setEditDescriptionText(selectedTask.description || '');
                        setIsEditingDescription(true);
                      }}
                      className="p-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      value={editDescriptionText}
                      onChange={(e) => setEditDescriptionText(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingDescription(false)}
                        className="px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          setIsEditingDescription(false);
                          const res = await updateTaskDescription(
                            selectedTask.id,
                            editDescriptionText
                          );
                          if (res.success) {
                            toast.success('Description updated');
                            await refreshTasks();
                          } else {
                            toast.error('Failed to update description');
                          }
                        }}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {selectedTask.description || 'No description provided.'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Assigned To
                    </p>
                    {selectedAssignees.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No assignees
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {selectedAssignees.map((assignee, index) => {
                          const isPrimary = assignee.role
                            ? assignee.role === 'primary'
                            : index === 0;
                          return (
                            <div
                              key={assignee.id ?? `${assignee.name}-${index}`}
                              className="flex items-center gap-2"
                            >
                              <img
                                src={assignee.avatar}
                                alt={assignee.name}
                                className="h-5 w-5 rounded-full ring-2 ring-white"
                              />
                              <p className="text-sm font-medium text-gray-800">
                                {assignee.name}
                              </p>
                              {isPrimary ? (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                                  Primary
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {selectedTask.assignee.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Due Date
                    </p>
                    <p
                      className={`text-sm font-medium ${selectedTask.isOverdue ? 'text-red-600' : 'text-gray-800'}`}
                    >
                      {selectedTask.dueDate
                        ? new Date(selectedTask.dueDate).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )
                        : 'No due date'}
                    </p>
                    <p
                      className={`text-xs ${selectedTask.isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}
                    >
                      {selectedTask.dueIn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Created
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(selectedTask.created).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        }
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Status
                    </p>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${selectedTask.statusColor}`}
                    >
                      {selectedTask.statusLabel}
                    </span>
                  </div>
                </div>
              </div>

              {selectedTask.status === 'IN_PROGRESS' && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-700">
                      Progress
                    </h4>
                    <span className="text-xs font-medium text-gray-700">
                      {selectedTask.progress}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${selectedTask.progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 border-t border-border/40 pt-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted/50 p-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      Organization
                    </p>
                    <p className="text-sm font-medium text-gray-800">
                      {selectedTask.organization ??
                        selectedTask.assignee.department}
                    </p>
                  </div>
                </div>
              </div>

              {/* Subtasks */}
              {selectedTask.subtasks.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                    <ListTodo className="h-3.5 w-3.5" />
                    Subtasks (
                    {selectedTask.subtasks.filter((s) => s.completed).length}/
                    {selectedTask.subtasks.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTask.subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 rounded-lg border border-border/40 bg-white p-2"
                      >
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          readOnly
                          className="h-4 w-4 rounded border-border/40 text-primary"
                        />
                        <span
                          className={`flex-1 text-xs ${
                            subtask.completed
                              ? 'text-muted-foreground line-through'
                              : 'text-gray-800'
                          }`}
                        >
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTask.attachments.length > 0 && (
                <div className="mt-6">
                  <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                    <Paperclip className="h-3.5 w-3.5" />
                    Attachments ({selectedTask.attachments.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTask.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between rounded-lg border border-border/40 bg-white p-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {attachment.type?.includes('pdf') ? (
                            <FileText className="h-4 w-4 text-red-500" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-gray-800">
                              {attachment.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {attachment.size || '—'}
                            </p>
                          </div>
                        </div>
                        {attachment.url ? (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-primary hover:text-primary/80"
                          >
                            Download
                          </a>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            Unavailable
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="mt-6">
                <h4 className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-700">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments ({selectedTask.comments.length})
                </h4>
                <div className="space-y-4">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="h-8 w-8 flex-shrink-0 rounded-full ring-2 ring-white"
                      />
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-800">
                            {comment.author}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {comment.timestamp
                              ? new Date(comment.timestamp).toLocaleDateString(
                                  'en-US',
                                  {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )
                              : 'Just now'}
                          </p>
                        </div>
                        <p className="text-xs leading-relaxed text-gray-700">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-start gap-3 border-t border-border/40 pt-2">
                    <img
                      src={
                        currentUser?.avatar ||
                        getAvatarUrl({
                          full_name: 'Team Lead',
                          email: 'team-lead',
                        })
                      }
                      alt={currentUser?.name || 'You'}
                      className="h-8 w-8 flex-shrink-0 rounded-full ring-2 ring-white"
                    />
                    <div className="flex-1">
                      <textarea
                        placeholder="Add a comment..."
                        rows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={async () => {
                          if (!newComment.trim()) return;
                          setIsPostingComment(true);
                          try {
                            const res = await createTaskComment(
                              selectedTask.id,
                              newComment.trim()
                            );
                            if (res.success) {
                              toast.success('Comment posted');
                              setNewComment('');
                              await refreshTasks();
                            } else {
                              toast.error('Failed to post comment');
                            }
                          } catch {
                            toast.error('Failed to post comment');
                          } finally {
                            setIsPostingComment(false);
                          }
                        }}
                        disabled={isPostingComment || !newComment.trim()}
                        className="mt-2 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                      >
                        {isPostingComment ? 'Posting...' : 'Post comment'}
                      </button>
                    </div>
                  </div>
                </div>
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
                  onClick={() =>
                    handleToggleStatus(selectedTask.id, selectedTask.status)
                  }
                  className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  Mark as{' '}
                  {selectedTask.status === 'DONE'
                    ? getPlainStatusLabel('TODO')
                    : getPlainStatusLabel('DONE')}
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

      {/* Task Rating Prompt - shows when there are tasks pending rating */}
      {pendingRatings.length > 0 && (
        <TaskRatingPrompt
          pendingTasks={pendingRatings}
          onRated={() => refreshTasks()}
        />
      )}
    </div>
  );
}
