'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Pin, MoreHorizontal, FileText, CheckCheck, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';

const announcements = [
    {
        id: 1,
        title: 'Sprint 42 Planning & Retro',
        content: 'Quick reminder that our sprint planning for Sprint 42 is moved to Thursday 10 AM due to the holiday. Please have your tickets estimated before then.',
        author: 'Sarah Jenkins',
        role: 'Team Lead',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        date: '2 hours ago',
        tag: 'Process',
        tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        pinned: true,
        readCount: 12
    },
    {
        id: 2,
        title: 'Updated Code Review Guidelines',
        content: 'We have updated the PR checklist to include a mandatory security scan. Please review the "Eng-Handook" notion page. This applies to all backend repositories immediately.',
        author: 'Marcus Cole',
        role: 'Senior Engineer',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
        date: 'Yesterday',
        tag: 'Engineering',
        tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
        pinned: true,
        readCount: 18
    },
    {
        id: 3,
        title: 'Team Lunch this Friday 🍕',
        content: 'To celebrate deploying v2.1 without any hotfixes (yay!), we are ordering pizza this Friday. Please slack me your dietary preferences by EOD.',
        author: 'Culture Committee',
        role: 'Internal',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Party',
        date: 'Oct 23, 2024',
        tag: 'Social',
        tagColor: 'bg-rose-50 text-rose-700 border-rose-200',
        pinned: false,
        readCount: 10
    },
    {
        id: 4,
        title: 'New Staging Environment',
        content: 'The new staging environment (staging-v2) is now live. It mirrors production data (anonymized). Please switch your local configs to point clearly to it.',
        author: 'DevOps',
        role: 'System',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=System',
        date: 'Oct 20, 2024',
        tag: 'DevOps',
        tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        pinned: false,
        readCount: 15
    },
];

export default function AnnouncementsPage() {
    return (
        <div className="space-y-8 p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Team Updates</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Internal memos and operational updates for the Engineering Squad.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Input placeholder="Search memos..." className="w-64 h-9 text-sm bg-white" />
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4">
                        <Plus className="mr-2 h-4 w-4" /> New Memo
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">

                {announcements.map((item) => (
                    <Card key={item.id} className={`group transition-all duration-200 border bg-white ${item.pinned ? 'border-indigo-200 shadow-sm ring-1 ring-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <CardHeader className="p-6 pb-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-100">
                                        <AvatarImage src={item.avatar} />
                                        <AvatarFallback>A</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">{item.author}</div>
                                        <div className="text-xs text-slate-500">{item.role} • {item.date}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.pinned && (
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 items-center gap-1 hidden sm:flex">
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
                                    {item.pinned && <Pin className="h-4 w-4 text-indigo-600 sm:hidden flex-shrink-0 fill-indigo-600" />}
                                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    <Badge variant="outline" className={`font-normal ml-2 ${item.tagColor}`}>
                                        {item.tag}
                                    </Badge>
                                </div>

                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                                    {item.content}
                                </p>

                                {/* Footer Status - No Interactions */}
                                <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-50">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400" title="Team members who have viewed this">
                                            <CheckCheck className="h-3.5 w-3.5 text-indigo-400" /> {item.readCount} seen
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> Expires in 30 days
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <Button variant="ghost" className="text-sm text-slate-500">
                    <FileText className="mr-2 h-4 w-4" /> View Archived Memos
                </Button>
            </div>
        </div>
    );
}
