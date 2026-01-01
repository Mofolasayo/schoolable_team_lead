'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Pin, MoreHorizontal, FileText, CheckCheck, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getAnnouncements, Announcement } from '@/lib/api/team-lead';

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCategoryColor(category: string | null): string {
    switch (category?.toLowerCase()) {
        case 'engineering':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'process':
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'social':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'devops':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'hr':
            return 'bg-purple-50 text-purple-700 border-purple-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getAnnouncements();
                setAnnouncements(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch announcements');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    // Filter announcements based on search
    const filteredAnnouncements = announcements.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate pinned and regular announcements
    const pinnedAnnouncements = filteredAnnouncements.filter(a => a.is_pinned);
    const regularAnnouncements = filteredAnnouncements.filter(a => !a.is_pinned);
    const sortedAnnouncements = [...pinnedAnnouncements, ...regularAnnouncements];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-sm text-slate-500">Loading announcements...</p>
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
                    <h3 className="text-lg font-semibold text-slate-900">Failed to Load Announcements</h3>
                    <p className="text-sm text-slate-500">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="mt-2">
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Updates</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Internal memos and operational updates for the team.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Input
                            placeholder="Search memos..."
                            className="w-64 h-9 text-sm bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4">
                        <Plus className="mr-2 h-4 w-4" /> New Memo
                    </Button>
                </div>
            </div>

            {sortedAnnouncements.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500">
                        {searchQuery ? 'No announcements match your search.' : 'No announcements yet.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {sortedAnnouncements.map((item) => (
                        <Card
                            key={item.id}
                            className={`group transition-all duration-200 border bg-white ${item.is_pinned
                                    ? 'border-indigo-200 shadow-sm ring-1 ring-indigo-50'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <CardHeader className="p-6 pb-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-slate-100">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author_id}`} />
                                            <AvatarFallback>{item.author_name?.[0] || 'A'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-900">
                                                {item.author_name || 'Team'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {formatDate(item.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.is_pinned && (
                                            <Badge
                                                variant="secondary"
                                                className="bg-indigo-50 text-indigo-700 border-indigo-100 items-center gap-1 hidden sm:flex"
                                            >
                                                <Pin className="h-3 w-3 fill-indigo-700" /> Pinned
                                            </Badge>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-6 pt-2">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        {/* Mobile Pin Badge */}
                                        {item.is_pinned && (
                                            <Pin className="h-4 w-4 text-indigo-600 sm:hidden flex-shrink-0 fill-indigo-600" />
                                        )}
                                        <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                            {item.title}
                                        </h3>
                                        {item.category && (
                                            <Badge variant="outline" className={`font-normal ml-2 ${getCategoryColor(item.category)}`}>
                                                {item.category}
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                                        {item.content}
                                    </p>

                                    {/* Footer Status */}
                                    <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="flex items-center gap-1.5 text-xs text-slate-400"
                                                title="Team members who have viewed this"
                                            >
                                                <CheckCheck className="h-3.5 w-3.5 text-indigo-400" /> Visible to team
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> Posted {formatDate(item.created_at)}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <div className="flex justify-center pt-4">
                <Button variant="ghost" className="text-sm text-slate-500">
                    <FileText className="mr-2 h-4 w-4" /> View Archived Memos
                </Button>
            </div>
        </div>
    );
}
