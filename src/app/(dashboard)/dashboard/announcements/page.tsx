'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { CalendarClock, Plus, Search, Users, Loader2 } from 'lucide-react';
import {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementReaders,
  getDashboardStats,
  type Announcement,
  type AnnouncementReader,
} from '@/lib/api/team-lead';
import { toast } from 'sonner';

type AnnouncementItem = {
  id: string;
  title: string;
  summary: string;
  status: 'Published' | 'Draft' | 'Scheduled';
  publishedAt: string;
  audience: string;
  author: string;
  tags: string[];
  pinned?: boolean;
  originalContent: string;
  scheduledAt: string;
};

export default function AnnouncementsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [department, setDepartment] = useState<string>('');
  const [readers, setReaders] = useState<AnnouncementReader[]>([]);
  const [isReadersLoading, setIsReadersLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('All Staff');
  const [content, setContent] = useState('');

  // Scheduling State
  const [scheduledDate, setScheduledDate] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const [announcementsData, statsData] = await Promise.all([
        getAnnouncements(),
        getDashboardStats(),
      ]);

      setDepartment(statsData.department);

      const filteredAnnouncements = announcementsData.filter(
        (a: Announcement) =>
          !a.audience ||
          a.audience === 'All Staff' ||
          a.audience.toLowerCase() === statsData.department.toLowerCase()
      );

      const mapped: AnnouncementItem[] = (filteredAnnouncements || []).map(
        (a) => ({
          id: a.id,
          title: a.title,
          summary: a.content || '',
          status: (a.status as AnnouncementItem['status']) || 'Published',
          publishedAt: a.scheduled_at
            ? new Date(a.scheduled_at).toLocaleDateString() +
              ' • ' +
              new Date(a.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : new Date(
                a.created_at ?? new Date().toISOString()
              ).toLocaleDateString() +
              ' • ' +
              new Date(
                a.created_at ?? new Date().toISOString()
              ).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
          audience: a.audience ?? 'All Staff',
          author: a.author_name || 'Admin',
          tags: [],
          pinned: a.is_pinned ?? undefined,
          originalContent: a.content ?? '',
          scheduledAt: a.scheduled_at
            ? new Date(a.scheduled_at).toISOString().substring(0, 16)
            : '',
        })
      );
      setItems(mapped);
      if (mapped.length > 0 && !selectedId && mapped[0])
        setSelectedId(mapped[0].id);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      toast.error('Failed to load announcements');
    } finally {
      setIsFetching(false);
    }
  }, [selectedId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedId) {
      setReaders([]);
      return;
    }
    setIsReadersLoading(true);
    getAnnouncementReaders(selectedId)
      .then((data) => {
        if (!isMounted) return;
        setReaders(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsReadersLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  const startEdit = (announcement: AnnouncementItem) => {
    setEditingId(announcement.id);
    setTitle(announcement.title);
    setContent(announcement.originalContent);
    setAudience(announcement.audience);
    setIsScheduled(!!announcement.scheduledAt);
    setScheduledDate(announcement.scheduledAt);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    setIsLoading(true);
    try {
      await deleteAnnouncement(id);
      toast.success('Announcement deleted');
      setSelectedId(null);
      await fetchAnnouncements();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (
    targetStatus: 'Published' | 'Draft' | 'Scheduled'
  ) => {
    if (!title || !content) {
      toast.error('Please fill in title and content');
      return;
    }

    if (targetStatus === 'Scheduled' && !scheduledDate) {
      toast.error('Please select a date for scheduling');
      return;
    }

    setIsLoading(true);

    const payload = {
      title,
      content,
      audience: department || audience,
      pinned: false,
      status: targetStatus,
      scheduledAt:
        targetStatus === 'Scheduled' && scheduledDate
          ? new Date(scheduledDate).toISOString()
          : null,
    };

    try {
      if (editingId) {
        await updateAnnouncement(editingId, payload);
      } else {
        await createAnnouncement(payload);
      }

      toast.success(
        editingId
          ? 'Announcement updated!'
          : targetStatus === 'Draft'
            ? 'Saved to drafts'
            : 'Announcement saved!'
      );
      setIsCreateModalOpen(false);
      setEditingId(null);
      setTitle('');
      setContent('');
      setAudience('All Staff');
      setScheduledDate('');
      setIsScheduled(false);
      await fetchAnnouncements();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to save announcement';
      if (!editingId) {
        try {
          const [latestAnnouncements, latestStats] = await Promise.all([
            getAnnouncements(),
            getDashboardStats(),
          ]);
          const latestDepartment = latestStats.department;
          const candidate = latestAnnouncements.find(
            (a) =>
              a.title === title &&
              (a.content || '') === content &&
              (a.audience || latestDepartment) ===
                (department || latestDepartment)
          );
          if (candidate) {
            toast.success('Announcement saved!');
            setIsCreateModalOpen(false);
            setEditingId(null);
            setTitle('');
            setContent('');
            setAudience('All Staff');
            setScheduledDate('');
            setIsScheduled(false);
            await fetchAnnouncements();
            return;
          }
        } catch {
          // fall through to error toast
        }
      }
      toast.error('Failed to save: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    const published = items.filter(
      (item) => item.status === 'Published'
    ).length;
    const scheduled = items.filter(
      (item) => item.status === 'Scheduled'
    ).length;
    const drafts = items.filter((item) => item.status === 'Draft').length;
    return { published, scheduled, drafts };
  }, [items]);

  const filteredAnnouncements = items.filter((item) => {
    const matchesStatus =
      statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const selectedAnnouncement = items.find((a) => a.id === selectedId);
  const audienceOptions = useMemo(() => {
    return department ? [department] : ['Loading...'];
  }, [department]);

  const statusStyles: Record<string, string> = {
    Published: 'bg-primary/10 text-primary',
    Scheduled: 'bg-amber-50 text-amber-700',
    Draft: 'bg-muted text-gray-700',
  };

  if (isFetching) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading announcements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Announcements</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep teams aligned with scheduled updates and policy changes.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setTitle('');
            setContent('');
            setAudience(department || '');
            setScheduledDate('');
            setIsScheduled(false);
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New announcement
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Published',
            value: summary.published,
            helper: 'Active announcements',
          },
          {
            label: 'Scheduled',
            value: summary.scheduled,
            helper: 'Upcoming updates',
          },
          { label: 'Drafts', value: summary.drafts, helper: 'Saved for later' },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-border/40 bg-white p-4 shadow-sm"
          >
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {card.label}
            </p>
            <p className="mb-1 text-2xl font-normal tracking-tight text-gray-800">
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground">{card.helper}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-border/40 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['All', 'Published', 'Scheduled', 'Draft'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout - Split Panel */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* List */}
        <div className="space-y-3">
          {filteredAnnouncements.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                selectedId === item.id
                  ? 'border-primary ring-1 ring-primary'
                  : 'border-border/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[item.status]}`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.publishedAt}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-800">
                  {item.title}
                </h3>
                <p className="line-clamp-2 max-w-4xl text-xs leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
              </div>
            </div>
          ))}

          {filteredAnnouncements.length === 0 && (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              No announcements found for your team.
            </div>
          )}
        </div>

        {/* Detail View (Sidebar) */}
        <div className="space-y-4">
          {selectedAnnouncement ? (
            <div className="sticky top-6 rounded-xl border border-border/40 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <span
                  className={`mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[selectedAnnouncement.status]}`}
                >
                  {selectedAnnouncement.status}
                </span>
                <h2 className="text-xl font-medium text-gray-800">
                  {selectedAnnouncement.title}
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="mb-1 text-muted-foreground">Published</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {selectedAnnouncement.publishedAt}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Author</p>
                    <p className="font-medium text-gray-800">
                      {selectedAnnouncement.author}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-muted-foreground">Audience</p>
                    <p className="flex items-center gap-2 font-medium text-gray-800">
                      <Users className="h-3.5 w-3.5" />
                      {selectedAnnouncement.audience}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
                    {selectedAnnouncement.summary}
                  </p>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      Readers
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {readers.length} read
                    </span>
                  </div>
                  {isReadersLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Loading readers...
                    </p>
                  ) : readers.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No reads yet.
                    </p>
                  ) : (
                    <div className="max-h-48 space-y-3 overflow-y-auto pr-2 text-xs text-gray-700">
                      {readers.map((reader) => (
                        <div
                          key={`${reader.user_id}-${reader.read_at ?? ''}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {reader.full_name || 'Unknown'}
                            </p>
                            <p className="text-muted-foreground">
                              {reader.email || 'No email'}{' '}
                              {reader.department
                                ? `• ${reader.department}`
                                : ''}
                            </p>
                          </div>
                          <div className="text-right text-[11px] text-muted-foreground">
                            {reader.read_at
                              ? new Date(reader.read_at).toLocaleString()
                              : 'Unknown time'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => startEdit(selectedAnnouncement)}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
                  >
                    Edit Announcement
                  </button>
                  <button
                    onClick={() => handleDelete(selectedAnnouncement.id)}
                    className="flex-1 rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
              Select an announcement to view details
            </div>
          )}
        </div>
      </div>

      {/* Create Modal Overlay */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/40 p-4">
              <h3 className="text-lg font-medium text-gray-800">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="sr-only">Close</span>
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
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., Office Closure Notice"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Audience
                </label>
                <select
                  value={department ? department : 'Loading...'}
                  onChange={(e) => setAudience(e.target.value)}
                  disabled
                  className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
                >
                  {audienceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Announcements from team leads are sent to their own team only.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full resize-none rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  placeholder="Write your announcement here..."
                />
              </div>
              <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 p-3">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="h-4 w-4 rounded border-border/40 text-primary focus:ring-primary/30"
                  />
                  Schedule for later
                </label>
                {isScheduled && (
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-lg border border-border/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                  />
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border/40 bg-gray-50/50 p-4">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(isScheduled ? 'Scheduled' : 'Draft')}
                disabled={isLoading}
                className="rounded-md border border-border/40 bg-white px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
              >
                {isScheduled ? 'Schedule' : 'Save draft'}
              </button>
              <button
                onClick={() => handleSave('Published')}
                disabled={isLoading}
                className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Publish now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
