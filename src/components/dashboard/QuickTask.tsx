'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

export function QuickTask() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="font-medium">Assign Quick Task</CardTitle>
                <CardDescription>Delegate a task to a team member immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Task Title</Label>
                    <Input id="title" placeholder="e.g. Review PR #123" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="assignee">Assignee</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="assignee">
                        <option value="">Select team member...</option>
                        <option value="alice">Alice Johnson</option>
                        <option value="bob">Bob Smith</option>
                        <option value="charlie">Charlie Brown</option>
                        <option value="diana">Diana Prince</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" id="priority">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="due">Due Date</Label>
                        <Input id="due" type="date" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Brief details..." />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" /> Assign Task
                </Button>
            </CardFooter>
        </Card>
    );
}
