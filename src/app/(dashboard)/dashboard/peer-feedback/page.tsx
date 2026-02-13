'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Send,
  Star,
  Users,
  Heart,
  Brain,
  Lightbulb,
  MessageSquare,
  Check,
  ChevronRight,
  Shield,
  Target,
  Crown,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  getTeamMembers,
  submitPeerFeedback,
  getReferenceData,
  type ReferenceData,
  TeamMember as ApiTeamMember,
} from '@/lib/api/team-lead';

// Types
interface Colleague {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarUrl?: string;
  isTeamLead?: boolean;
}

interface PeerRatings {
  supportRating: number;
  collaborationRating: number;
  adaptabilityRating: number;
  valuesRating: number;
  accountabilityRating: number;
  feedbackRating: number;
  // For team leads
  orgGuidanceRating?: number;
  peopleCultureRating?: number;
  influenceRating?: number;
}

type PeerRatingKey = keyof PeerRatings;

interface PeerFeedback {
  colleagueId: string;
  ratings: PeerRatings;
  strengths: string;
  areasForImprovement: string;
}

const getCurrentQuarter = (): string => {
  const month = new Date().getMonth();
  if (month < 3) return 'Q1';
  if (month < 6) return 'Q2';
  if (month < 9) return 'Q3';
  return 'Q4';
};

const CRITERIA_DECORATIONS: Record<
  PeerRatingKey,
  { icon: typeof Star; color: string; bgColor: string }
> = {
  supportRating: {
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  collaborationRating: {
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  adaptabilityRating: {
    icon: Brain,
    color: 'text-primary',
    bgColor: 'bg-purple-50',
  },
  valuesRating: {
    icon: Shield,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  accountabilityRating: {
    icon: Target,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  feedbackRating: {
    icon: Lightbulb,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  orgGuidanceRating: {
    icon: Crown,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  peopleCultureRating: {
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  influenceRating: {
    icon: Star,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
};

// Star Rating Component
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(star)}
          className="p-1 transition-all hover:scale-110 focus:outline-none"
        >
          <Star
            className={`h-6 w-6 transition-all ${
              star <= (hovered ?? value)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-50 text-slate-200'
            }`}
          />
        </button>
      ))}
      <span className="ml-3 w-8 text-sm font-medium text-slate-500">
        {(hovered ?? value) > 0 ? (hovered ?? value) + '/5' : ''}
      </span>
    </div>
  );
}

export default function PeerFeedbackPage() {
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentColleagueIndex, setCurrentColleagueIndex] = useState(0);
  const [feedbackList, setFeedbackList] = useState<
    Record<string, PeerFeedback>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quarter] = useState(getCurrentQuarter());
  const [year] = useState(new Date().getFullYear());
  const [showSummary, setShowSummary] = useState(false);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(
    null
  );

  const decorateCriteria = (
    items: ReferenceData['peerFeedbackCriteria']['peer']
  ) =>
    items.map((item) => {
      const key = item.key as PeerRatingKey;
      return {
        ...item,
        key,
        ...(CRITERIA_DECORATIONS[key] || {
          icon: Star,
          color: 'text-slate-500',
          bgColor: 'bg-slate-50',
        }),
      };
    });

  const peerCriteria = decorateCriteria(
    referenceData?.peerFeedbackCriteria?.peer ?? []
  );
  const leadershipCriteria = decorateCriteria(
    referenceData?.peerFeedbackCriteria?.leadership ?? []
  );

  // Fetch colleagues
  useEffect(() => {
    const fetchColleagues = async () => {
      try {
        setIsLoading(true);
        const [data, refs] = await Promise.all([
          getTeamMembers(true),
          getReferenceData().catch((err) => {
            console.warn('Failed to load reference data:', err);
            return null;
          }),
        ]);
        // Get all team members for peer feedback (including team lead)
        const members: Colleague[] = data.members.map((m: ApiTeamMember) => ({
          id: m.id,
          name: m.full_name,
          role: m.job_title || 'Team Member',
          department: m.department,
          avatarUrl: m.avatar_url,
          isTeamLead: m.is_team_lead,
        }));
        setColleagues(members);
        if (refs) {
          setReferenceData(refs);
        }
      } catch (err) {
        toast.error('Failed to load team members');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchColleagues();
  }, []);

  const currentColleague = colleagues[currentColleagueIndex];
  const isLastColleague = currentColleagueIndex === colleagues.length - 1;
  const isFirstColleague = currentColleagueIndex === 0;

  // Initialize feedback for current colleague
  useEffect(() => {
    if (currentColleague && !feedbackList[currentColleague.id]) {
      setFeedbackList((prev) => ({
        ...prev,
        [currentColleague.id]: {
          colleagueId: currentColleague.id,
          ratings: {
            supportRating: 0,
            collaborationRating: 0,
            adaptabilityRating: 0,
            valuesRating: 0,
            accountabilityRating: 0,
            feedbackRating: 0,
            orgGuidanceRating: 0,
            peopleCultureRating: 0,
            influenceRating: 0,
          },
          strengths: '',
          areasForImprovement: '',
        },
      }));
    }
  }, [currentColleague, feedbackList]);

  const colleagueId = currentColleague?.id ?? '';
  const currentFeedback = feedbackList[colleagueId] || {
    colleagueId: colleagueId,
    ratings: {
      supportRating: 0,
      collaborationRating: 0,
      adaptabilityRating: 0,
      valuesRating: 0,
      accountabilityRating: 0,
      feedbackRating: 0,
      orgGuidanceRating: 0,
      peopleCultureRating: 0,
      influenceRating: 0,
    },
    strengths: '',
    areasForImprovement: '',
  };

  // Check if feedback is complete
  const isCurrentFeedbackComplete = () => {
    const ratings = currentFeedback.ratings;
    const baseComplete =
      ratings.supportRating > 0 &&
      ratings.collaborationRating > 0 &&
      ratings.adaptabilityRating > 0 &&
      ratings.valuesRating > 0 &&
      ratings.accountabilityRating > 0 &&
      ratings.feedbackRating > 0;

    if (currentColleague?.isTeamLead) {
      return (
        baseComplete &&
        ratings.orgGuidanceRating! > 0 &&
        ratings.peopleCultureRating! > 0 &&
        ratings.influenceRating! > 0
      );
    }
    return baseComplete;
  };

  // Count completed feedback
  const completedCount = Object.values(feedbackList).filter((f) => {
    const ratings = f.ratings;
    return (
      ratings.supportRating > 0 &&
      ratings.collaborationRating > 0 &&
      ratings.adaptabilityRating > 0 &&
      ratings.valuesRating > 0 &&
      ratings.accountabilityRating > 0 &&
      ratings.feedbackRating > 0
    );
  }).length;

  const allFeedbackComplete = completedCount === colleagues.length;

  // Handlers
  const updateRating = (ratingKey: keyof PeerRatings, value: number) => {
    if (!currentColleague) return;
    const id = currentColleague.id;
    const existing = feedbackList[id] || {
      colleagueId: id,
      ratings: {
        supportRating: 0,
        collaborationRating: 0,
        adaptabilityRating: 0,
        valuesRating: 0,
        accountabilityRating: 0,
        feedbackRating: 0,
        orgGuidanceRating: 0,
        peopleCultureRating: 0,
        influenceRating: 0,
      },
      strengths: '',
      areasForImprovement: '',
    };
    setFeedbackList((prev) => ({
      ...prev,
      [id]: {
        ...existing,
        ratings: {
          ...existing.ratings,
          [ratingKey]: value,
        },
      },
    }));
  };

  const updateNotes = (
    field: 'strengths' | 'areasForImprovement',
    value: string
  ) => {
    if (!currentColleague) return;
    const id = currentColleague.id;
    const existing = feedbackList[id];
    if (!existing) return;
    setFeedbackList((prev) => ({
      ...prev,
      [id]: {
        ...existing,
        [field]: value,
      },
    }));
  };

  const goToNextColleague = () => {
    if (isLastColleague) {
      setShowSummary(true);
    } else {
      setCurrentColleagueIndex((prev) => prev + 1);
    }
  };

  const goToPreviousColleague = () => {
    if (showSummary) {
      setShowSummary(false);
    } else if (currentColleagueIndex > 0) {
      setCurrentColleagueIndex((prev) => prev - 1);
    }
  };

  const handleSubmitAll = async () => {
    if (!allFeedbackComplete) {
      toast.error(
        'Please complete feedback for all colleagues before submitting.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit each feedback
      for (const feedback of Object.values(feedbackList)) {
        await submitPeerFeedback({
          toEmployeeId: feedback.colleagueId,
          quarter,
          year,
          supportRating: feedback.ratings.supportRating,
          collaborationRating: feedback.ratings.collaborationRating,
          adaptabilityRating: feedback.ratings.adaptabilityRating,
          valuesRating: feedback.ratings.valuesRating,
          accountabilityRating: feedback.ratings.accountabilityRating,
          feedbackRating: feedback.ratings.feedbackRating,
          orgGuidanceRating: feedback.ratings.orgGuidanceRating,
          peopleCultureRating: feedback.ratings.peopleCultureRating,
          influenceRating: feedback.ratings.influenceRating,
          strengths: feedback.strengths,
          areasForImprovement: feedback.areasForImprovement,
          isAnonymous: true,
        });
      }
      toast.success(`${quarter} peer feedback submitted successfully!`);
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = showSummary
    ? colleagues.length + 1
    : currentColleagueIndex + 1;
  const totalSteps = colleagues.length + 1;
  const completionPercentage = (currentStep / totalSteps) * 100;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600">Loading colleagues...</p>
        </div>
      </div>
    );
  }

  // Summary Page
  if (showSummary) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Review & Submit Feedback
              </h1>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span>{quarter}</span>
                <span className="h-4 w-px bg-slate-200" />
                <span>{year}</span>
              </div>
            </div>
            <Progress value={100} className="h-1.5 w-full bg-slate-100" />
          </div>

          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">
                Feedback Summary
              </CardTitle>
              <CardDescription>
                Review your peer feedback before final submission.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {colleagues.map((colleague) => {
                  const feedback = feedbackList[colleague.id];
                  const isComplete =
                    feedback &&
                    feedback.ratings.supportRating > 0 &&
                    feedback.ratings.collaborationRating > 0 &&
                    feedback.ratings.adaptabilityRating > 0;

                  return (
                    <div
                      key={colleague.id}
                      className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-100">
                          <AvatarImage src={colleague.avatarUrl} />
                          <AvatarFallback>{colleague.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium text-slate-700">
                            {colleague.name}
                          </span>
                          {colleague.isTeamLead && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Team Lead
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isComplete ? (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Check className="h-4 w-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">
                            Complete
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-amber-500">
                          Pending
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-indigo-100 p-3">
                  <MessageSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Your feedback is anonymous
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    All peer feedback is submitted anonymously. Your colleagues
                    will only see aggregated scores and comments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4 border-t border-slate-200 pt-4">
            <Button
              variant="outline"
              onClick={goToPreviousColleague}
              className="bg-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={handleSubmitAll}
              disabled={isSubmitting || !allFeedbackComplete}
              className="flex-1 bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Submit All Feedback
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Individual Colleague Feedback View
  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Progress Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Weekly Peer Feedback
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-white font-normal text-slate-600"
                >
                  {quarter} {year}
                </Badge>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-sm text-slate-500">Anonymous</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-slate-500">
              <span>Progress</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress
              value={completionPercentage}
              className="h-1.5 w-full bg-slate-200"
            />
          </div>
        </div>

        {/* Colleague Card */}
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
          <div
            className={`relative h-24 ${currentColleague?.isTeamLead ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'}`}
          >
            <div className="absolute -bottom-8 left-8">
              <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                <AvatarImage src={currentColleague?.avatarUrl} />
                <AvatarFallback className="bg-slate-100 text-xl">
                  {currentColleague?.name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          <CardContent className="px-8 pb-6 pt-10">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {currentColleague?.name}
                </h2>
                <p className="font-medium text-slate-500">
                  {currentColleague?.role} • {currentColleague?.department}
                </p>
              </div>
              {currentColleague?.isTeamLead && (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                  <Crown className="mr-1 h-3 w-3" />
                  Team Lead
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Peer Rating Items */}
        <div className="grid gap-4">
          {peerCriteria.map((item) => {
            const Icon = item.icon;
            const rating = currentFeedback.ratings[item.key] ?? 0;

            return (
              <Card
                key={item.key}
                className="border-slate-200 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    <div
                      className={`h-10 w-10 rounded-xl p-2.5 ${item.bgColor} ${item.color} flex shrink-0 items-center justify-center`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {item.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <StarRating
                        value={rating}
                        onChange={(value) => updateRating(item.key, value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Leadership ratings for team leads */}
          {currentColleague?.isTeamLead && (
            <>
              <div className="pb-2 pt-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                  Leadership Qualities
                </h3>
              </div>
              {leadershipCriteria.map((item) => {
                const Icon = item.icon;
                const rating = currentFeedback.ratings[item.key] || 0;

                return (
                  <Card
                    key={item.key}
                    className="border-slate-200 shadow-sm transition-all hover:border-amber-100 hover:shadow-md"
                  >
                    <CardContent className="p-5">
                      <div className="flex gap-4">
                        <div
                          className={`h-10 w-10 rounded-xl p-2.5 ${item.bgColor} ${item.color} flex shrink-0 items-center justify-center`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              {item.name}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {item.description}
                            </p>
                          </div>
                          <StarRating
                            value={rating}
                            onChange={(value) => updateRating(item.key, value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        {/* Qualitative Feedback */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-50 pb-2">
            <CardTitle className="text-base font-semibold text-slate-900">
              Additional Comments
            </CardTitle>
            <CardDescription className="text-xs">
              Optional - Help your colleague grow with constructive feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                What they do well
              </label>
              <textarea
                value={currentFeedback.strengths}
                onChange={(e) => updateNotes('strengths', e.target.value)}
                placeholder="Share what you appreciate about working with this colleague..."
                className="h-20 w-full resize-none rounded-lg border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Areas for growth
              </label>
              <textarea
                value={currentFeedback.areasForImprovement}
                onChange={(e) =>
                  updateNotes('areasForImprovement', e.target.value)
                }
                placeholder="Suggest areas where they could improve..."
                className="h-20 w-full resize-none rounded-lg border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <Button
            variant="ghost"
            onClick={goToPreviousColleague}
            disabled={isFirstColleague}
            className="text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="text-xs font-medium text-slate-400">
            {currentColleagueIndex + 1} of {colleagues.length} Colleagues
          </div>

          <Button
            onClick={goToNextColleague}
            disabled={!isCurrentFeedbackComplete()}
            className="bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
          >
            {isLastColleague ? 'Review & Submit' : 'Next Colleague'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
