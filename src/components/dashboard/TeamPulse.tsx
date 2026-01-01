'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smile, Frown, Meh, Clock, User } from 'lucide-react';

const teamMembers = [
    {
        id: 1,
        name: 'Alice Johnson',
        role: 'Frontend Dev',
        status: 'happy',
        lastBreak: '1h ago',
        workload: 'Moderate',
    },
    {
        id: 2,
        name: 'Bob Smith',
        role: 'Backend Dev',
        status: 'neutral',
        lastBreak: '3h ago',
        workload: 'High',
    },
    {
        id: 3,
        name: 'Charlie Brown',
        role: 'Designer',
        status: 'stressed',
        lastBreak: '4h ago',
        workload: 'Overloaded',
    },
    {
        id: 4,
        name: 'Diana Prince',
        role: 'QA Engineer',
        status: 'happy',
        lastBreak: '30m ago',
        workload: 'Light',
    },
];

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'happy':
            return <Smile className="h-5 w-5 text-green-500" />;
        case 'neutral':
            return <Meh className="h-5 w-5 text-yellow-500" />;
        case 'stressed':
            return <Frown className="h-5 w-5 text-red-500" />;
        default:
            return <User className="h-5 w-5 text-gray-500" />;
    }
};

export function TeamPulse() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {member.name}
                        </CardTitle>
                        <StatusIcon status={member.status} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground mb-2">{member.role}</div>
                        <div className="flex items-center space-x-2 text-xs mb-1">
                            <Clock className="h-3 w-3" />
                            <span>Last break: {member.lastBreak}</span>
                        </div>
                        <div className="mt-2 text-xs flex justify-between items-center">
                            <span>Workload:</span>
                            <Badge variant={member.workload === 'Overloaded' ? 'destructive' : member.workload === 'High' ? 'secondary' : 'outline'}>
                                {member.workload}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
