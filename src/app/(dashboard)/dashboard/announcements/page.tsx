'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { CalendarClock, Search, Users, Loader2, Pin, MoreHorizontal, Plus, X } from 'lucide-react';
import {
    getAnnouncements,
    getDashboardStats,
    createAnnouncement,
    Announcement,
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
    pinned: boolean;
};

export default function AnnouncementsPage() {
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isFetching, setIsFetching] = useState(true);
    const [items, setItems] = useState<AnnouncementItem[]>([]);
    const [department, setDepartment] = useState<string>('');

    // Create announcement modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const fetchData = useCallback(async () => {
        try {
            const [announcementsData, statsData] = await Promise.all([
                getAnnouncements(),
                getDashboardStats(),
            ]);

            setDepartment(statsData.department);

            // Filter to show announcements for this team or all staff
            const filteredAnnouncements = announcementsData.filter((a: Announcement) =>
                !a.audience ||
                a.audience === 'All Staff' ||
                a.audience.toLowerCase() === statsData.department.toLowerCase()
            );

            const mapped: AnnouncementItem[] = filteredAnnouncements.map((a: Announcement) => ({
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
                    : new Date(a.created_at ?? new Date().toISOString()).toLocaleDateString() +
                    ' • ' +
                    new Date(a.created_at ?? new Date().toISOString()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                audience: a.audience ?? 'All Staff',
                author: a.author_name || 'Admin',
                pinned: a.is_pinned,
            }));

            setItems(mapped);
            if (mapped.length > 0 && !selectedId) {
                const firstItem = mapped[0];
                if (firstItem) setSelectedId(firstItem.id);
            }
        } catch (err) {
            console.error('Failed to fetch announcements:', err);
            toast.error('Failed to load announcements');
        } finally {
            setIsFetching(false);
        }
    }, [selectedId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const summary = useMemo(() => {
        const published = items.filter(item => item.status === 'Published').length;
        const scheduled = items.filter(item => item.status === 'Scheduled').length;
        const pinned = items.filter(item => item.pinned).length;
        return { published, scheduled, pinned };
    }, [items]);

    const filteredAnnouncements = items.filter(item => {
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchesSearch =
            searchQuery.trim() === '' ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.summary.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Sort pinned first
    const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
    });

    const selectedAnnouncement = items.find(a => a.id === selectedId);

    const statusStyles: Record<string, string> = {
        Published: 'bg-primary/10 text-primary',
        Scheduled: 'bg-amber-50 text-amber-700',
        Draft: 'bg-muted text-gray-700',
    };

    const handleCreateAnnouncement = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            toast.error('Title and content are required');
            return;
        }

        try {
            setIsSubmitting(true);
            await createAnnouncement({
                title: newTitle,
                content: newContent,
                audience: department || 'All Staff',
                status: 'Published',
            });
            toast.success('Announcement created!');
            setIsCreateModalOpen(false);
            setNewTitle('');
            setNewContent('');
            fetchData();
        } catch (err) {
            console.error('Failed to create announcement:', err);
            toast.error('Failed to create announcement');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading announcements...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Team Announcements</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Stay updated with announcements for {department || 'your team'}.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Announcement
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Published', value: summary.published, helper: 'Active announcements' },
                    { label: 'Scheduled', value: summary.scheduled, helper: 'Upcoming updates' },
                    { label: 'Pinned', value: summary.pinned, helper: 'Important notices' },
                ].map(card => (
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
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-lg border border-border/40 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {['All', 'Published', 'Scheduled'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === status
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
                    {sortedAnnouncements.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedId(item.id)}
                            className={`cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${selectedId === item.id
                                ? 'border-primary ring-1 ring-primary'
                                : 'border-border/40'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {item.pinned && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                                                <Pin className="h-2.5 w-2.5 fill-indigo-700" /> Pinned
                                            </span>
                                        )}
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[item.status]}`}
                                        >
                                            {item.status}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {item.publishedAt}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-800">{item.title}</h3>
                                    <p className="line-clamp-2 max-w-4xl text-xs leading-relaxed text-muted-foreground">
                                        {item.summary}
                                    </p>
                                </div>
                                <button className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {sortedAnnouncements.length === 0 && (
                        <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
                            No announcements found for your team.
                        </div>
                    )}
                </div>

                {/* Detail View (Sidebar) */}
                <div className="space-y-4">
                    {selectedAnnouncement ? (
                        <div className="sticky top-6 rounded-xl border border-border/40 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        {selectedAnnouncement.pinned && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                                <Pin className="h-2.5 w-2.5 fill-indigo-700" /> Pinned
                                            </span>
                                        )}
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyles[selectedAnnouncement.status]}`}
                                        >
                                            {selectedAnnouncement.status}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-medium text-gray-800">
                                        {selectedAnnouncement.title}
                                    </h2>
                                </div>
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

                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border/40 bg-white p-10 text-center text-sm text-muted-foreground">
                            Select an announcement to view details
                        </div>
                    )}
                </div>
            </div>

            {/* Create Announcement Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border/40 p-4">
                            <h3 className="text-lg font-medium text-gray-800">New Announcement</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Announcement title..."
                                    className="w-full rounded-lg border border-border/40 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    placeholder="Write your announcement..."
                                    rows={5}
                                    className="w-full rounded-lg border border-border/40 px-3 py-2 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                                This announcement will be visible to: <strong className="text-gray-700">{department || 'All Staff'}</strong>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 rounded-b-xl border-t border-border/40 bg-gray-50/50 p-4">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="rounded-md border border-border/40 bg-white px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateAnnouncement}
                                disabled={isSubmitting}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Creating...' : 'Create Announcement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
