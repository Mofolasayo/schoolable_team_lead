"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Users,
    Star,
    Heart,
    Brain,
    Lightbulb,
    Shield,
    Target,
    MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";

// Types
interface WeeklyTrend {
    week: string;
    support: number;
    collaboration: number;
    adaptability: number;
    values: number;
    accountability: number;
    openness: number;
    overall: number;
}

interface TeamMemberTrend {
    id: string;
    name: string;
    avatar: string;
    currentScore: number;
    previousScore: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    strongestArea: string;
    weakestArea: string;
}

// Mock data generators
const generateWeeklyTrends = (): WeeklyTrend[] => {
    const weeks = ['Week 48', 'Week 49', 'Week 50', 'Week 51', 'Week 1', 'Week 2'];
    return weeks.map((week, i) => ({
        week,
        support: 3.5 + Math.random() * 1.2 + i * 0.08,
        collaboration: 3.6 + Math.random() * 1.0 + i * 0.06,
        adaptability: 3.4 + Math.random() * 1.1 + i * 0.07,
        values: 3.8 + Math.random() * 0.8 + i * 0.05,
        accountability: 3.3 + Math.random() * 1.2 + i * 0.09,
        openness: 3.5 + Math.random() * 1.0 + i * 0.06,
        overall: 3.5 + Math.random() * 0.8 + i * 0.07,
    }));
};

const generateTeamMemberTrends = (): TeamMemberTrend[] => {
    const members = [
        { name: 'John Doe', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=John' },
        { name: 'Sarah Smith', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sarah' },
        { name: 'Mike Wilson', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Mike' },
        { name: 'Emily Davis', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Emily' },
        { name: 'David Brown', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=David' },
    ];

    const areas = ['Support', 'Collaboration', 'Adaptability', 'Values', 'Accountability', 'Openness'] as const;

    return members.map((m, i) => {
        const currentScore = 3.2 + Math.random() * 1.5;
        const previousScore = currentScore - 0.3 + Math.random() * 0.6;
        const change = currentScore - previousScore;

        return {
            id: `member-${i}`,
            name: m.name,
            avatar: m.avatar,
            currentScore: parseFloat(currentScore.toFixed(1)),
            previousScore: parseFloat(previousScore.toFixed(1)),
            change: parseFloat(change.toFixed(2)),
            trend: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable',
            strongestArea: areas[Math.floor(Math.random() * 3)]!,
            weakestArea: areas[3 + Math.floor(Math.random() * 3)]!,
        } as TeamMemberTrend;
    });
};

const CRITERIA_ICONS: Record<string, React.ReactNode> = {
    support: <Heart className="h-4 w-4" />,
    collaboration: <Users className="h-4 w-4" />,
    adaptability: <Lightbulb className="h-4 w-4" />,
    values: <Shield className="h-4 w-4" />,
    accountability: <Target className="h-4 w-4" />,
    openness: <Brain className="h-4 w-4" />,
};

const CRITERIA_COLORS: Record<string, string> = {
    support: '#ec4899',
    collaboration: '#3b82f6',
    adaptability: '#f59e0b',
    values: '#8b5cf6',
    accountability: '#10b981',
    openness: '#06b6d4',
};

export default function FeedbackTrendsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrend[]>([]);
    const [memberTrends, setMemberTrends] = useState<TeamMemberTrend[]>([]);
    const [activeTab, setActiveTab] = useState("team");
    const [selectedCriteria, setSelectedCriteria] = useState<string[]>(['overall']);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        setWeeklyTrends(generateWeeklyTrends());
        setMemberTrends(generateTeamMemberTrends());
        setIsLoading(false);
    };

    // Calculate stats
    const latestWeek = weeklyTrends[weeklyTrends.length - 1];
    const previousWeek = weeklyTrends[weeklyTrends.length - 2];
    const avgOverall = latestWeek?.overall?.toFixed(1) || '0.0';
    const overallChange = latestWeek && previousWeek
        ? ((latestWeek.overall - previousWeek.overall) / previousWeek.overall * 100).toFixed(1)
        : '0.0';
    const isImproving = parseFloat(overallChange) > 0;

    // Radar chart data
    const radarData = [
        { criteria: 'Support', current: latestWeek?.support || 0, previous: previousWeek?.support || 0 },
        { criteria: 'Collaboration', current: latestWeek?.collaboration || 0, previous: previousWeek?.collaboration || 0 },
        { criteria: 'Adaptability', current: latestWeek?.adaptability || 0, previous: previousWeek?.adaptability || 0 },
        { criteria: 'Values', current: latestWeek?.values || 0, previous: previousWeek?.values || 0 },
        { criteria: 'Accountability', current: latestWeek?.accountability || 0, previous: previousWeek?.accountability || 0 },
        { criteria: 'Openness', current: latestWeek?.openness || 0, previous: previousWeek?.openness || 0 },
    ];

    const toggleCriteria = (criteria: string) => {
        if (selectedCriteria.includes(criteria)) {
            setSelectedCriteria(selectedCriteria.filter(c => c !== criteria));
        } else {
            setSelectedCriteria([...selectedCriteria, criteria]);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-xl font-normal text-gray-800">Peer Feedback Trends</h1>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Track how team feedback scores evolve over time
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-primary/10 p-2">
                                <Star className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Team Average</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-normal">{avgOverall}</p>
                            <span className="text-lg text-muted-foreground">/5</span>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${isImproving ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isImproving ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {overallChange}% vs last week
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-emerald-100 p-2">
                                <TrendingUp className="h-5 w-5 text-emerald-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Top Improvers</span>
                        </div>
                        <p className="text-3xl font-normal text-emerald-600">
                            {memberTrends.filter(m => m.trend === 'up').length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">team members improving</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-amber-100 p-2">
                                {CRITERIA_ICONS['support']}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Strongest Area</span>
                        </div>
                        <p className="text-lg font-medium">
                            {latestWeek ? (() => {
                                const sorted = Object.entries(latestWeek)
                                    .filter(([k]) => k !== 'week' && k !== 'overall')
                                    .sort(([, a], [, b]) => (b as number) - (a as number));
                                const top = sorted[0];
                                return top ? top[0].charAt(0).toUpperCase() + top[0].slice(1) : 'N/A';
                            })() : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Highest rated criteria</p>
                    </CardContent>
                </Card>

                <Card className="border-border/40">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="rounded-full bg-blue-100 p-2">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Feedback Count</span>
                        </div>
                        <p className="text-3xl font-normal">{memberTrends.length * 4}</p>
                        <p className="text-xs text-muted-foreground mt-1">This week</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/50">
                    <TabsTrigger value="team" className="text-xs">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                        Team Trends
                    </TabsTrigger>
                    <TabsTrigger value="criteria" className="text-xs">
                        <Star className="h-3.5 w-3.5 mr-1.5" />
                        By Criteria
                    </TabsTrigger>
                    <TabsTrigger value="individuals" className="text-xs">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        Individual Progress
                    </TabsTrigger>
                </TabsList>

                {/* Team Trends Tab */}
                <TabsContent value="team" className="space-y-4">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Overall Trend Line Chart */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-normal">Overall Team Score</CardTitle>
                                <CardDescription className="text-xs">
                                    Average peer feedback score over time
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={weeklyTrends}>
                                            <defs>
                                                <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#575ff4" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#575ff4" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 5]} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'white',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                }}
                                                formatter={(value) => [parseFloat(value as string).toFixed(2), 'Score']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="overall"
                                                stroke="#575ff4"
                                                strokeWidth={2}
                                                fill="url(#colorOverall)"
                                                name="Overall"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Radar Chart */}
                        <Card className="border-border/40">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-sm font-normal">Criteria Comparison</CardTitle>
                                <CardDescription className="text-xs">
                                    Current week vs previous week
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[280px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis dataKey="criteria" tick={{ fontSize: 10 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} />
                                            <Radar
                                                name="Current"
                                                dataKey="current"
                                                stroke="#575ff4"
                                                fill="#575ff4"
                                                fillOpacity={0.3}
                                            />
                                            <Radar
                                                name="Previous"
                                                dataKey="previous"
                                                stroke="#94a3b8"
                                                fill="#94a3b8"
                                                fillOpacity={0.1}
                                                strokeDasharray="5 5"
                                            />
                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* By Criteria Tab */}
                <TabsContent value="criteria" className="space-y-4">
                    <Card className="border-border/40">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-sm font-normal">Trends by Rating Criteria</CardTitle>
                            <CardDescription className="text-xs">
                                Select criteria to compare trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Criteria toggles */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {Object.entries(CRITERIA_COLORS).map(([key, color]) => (
                                    <button
                                        key={key}
                                        onClick={() => toggleCriteria(key)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCriteria.includes(key)
                                            ? 'text-white'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                        style={{ backgroundColor: selectedCriteria.includes(key) ? color : undefined }}
                                    >
                                        {CRITERIA_ICONS[key]}
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </button>
                                ))}
                                <button
                                    onClick={() => toggleCriteria('overall')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedCriteria.includes('overall')
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                        }`}
                                >
                                    <Star className="h-3.5 w-3.5" />
                                    Overall
                                </button>
                            </div>

                            {/* Line chart */}
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={weeklyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 5]} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                                        {selectedCriteria.includes('support') && (
                                            <Line type="monotone" dataKey="support" stroke={CRITERIA_COLORS.support} strokeWidth={2} dot={{ r: 4 }} name="Support" />
                                        )}
                                        {selectedCriteria.includes('collaboration') && (
                                            <Line type="monotone" dataKey="collaboration" stroke={CRITERIA_COLORS.collaboration} strokeWidth={2} dot={{ r: 4 }} name="Collaboration" />
                                        )}
                                        {selectedCriteria.includes('adaptability') && (
                                            <Line type="monotone" dataKey="adaptability" stroke={CRITERIA_COLORS.adaptability} strokeWidth={2} dot={{ r: 4 }} name="Adaptability" />
                                        )}
                                        {selectedCriteria.includes('values') && (
                                            <Line type="monotone" dataKey="values" stroke={CRITERIA_COLORS.values} strokeWidth={2} dot={{ r: 4 }} name="Values" />
                                        )}
                                        {selectedCriteria.includes('accountability') && (
                                            <Line type="monotone" dataKey="accountability" stroke={CRITERIA_COLORS.accountability} strokeWidth={2} dot={{ r: 4 }} name="Accountability" />
                                        )}
                                        {selectedCriteria.includes('openness') && (
                                            <Line type="monotone" dataKey="openness" stroke={CRITERIA_COLORS.openness} strokeWidth={2} dot={{ r: 4 }} name="Openness" />
                                        )}
                                        {selectedCriteria.includes('overall') && (
                                            <Line type="monotone" dataKey="overall" stroke="#374151" strokeWidth={2.5} dot={{ r: 5 }} name="Overall" />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Individuals Tab */}
                <TabsContent value="individuals" className="space-y-4">
                    <Card className="border-border/40">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-normal">Team Member Progress</CardTitle>
                            <CardDescription className="text-xs">
                                Individual feedback score trends (anonymous aggregated data)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {memberTrends.sort((a, b) => b.currentScore - a.currentScore).map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-border/40">
                                                <AvatarImage src={member.avatar} />
                                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{member.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] text-emerald-600">
                                                        ↑ {member.strongestArea}
                                                    </span>
                                                    <span className="text-muted-foreground/40">•</span>
                                                    <span className="text-[10px] text-amber-600">
                                                        ↓ {member.weakestArea}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Progress Bar */}
                                            <div className="w-32">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[10px] text-muted-foreground">Score</span>
                                                    <span className="text-xs font-medium">{member.currentScore}/5</span>
                                                </div>
                                                <Progress value={(member.currentScore / 5) * 100} className="h-1.5" />
                                            </div>

                                            {/* Trend */}
                                            <div className="flex items-center gap-2">
                                                {member.trend === 'up' ? (
                                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">
                                                        <TrendingUp className="h-3 w-3 mr-1" />
                                                        +{member.change.toFixed(2)}
                                                    </Badge>
                                                ) : member.trend === 'down' ? (
                                                    <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">
                                                        <TrendingDown className="h-3 w-3 mr-1" />
                                                        {member.change.toFixed(2)}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">
                                                        Stable
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Insight box */}
                            <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-100">
                                <h4 className="text-xs font-medium text-blue-800 mb-2">📈 Trend Insights</h4>
                                <ul className="text-[11px] text-blue-700 space-y-1">
                                    <li>• {memberTrends.filter(m => m.trend === 'up').length} team members are showing improvement</li>
                                    <li>• Most common strength: {memberTrends[0]?.strongestArea || 'N/A'}</li>
                                    <li>• Area needing attention: {memberTrends.find(m => m.trend === 'down')?.weakestArea || 'None'}</li>
                                    <li>• Consider pairing high and low performers for mentoring</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
