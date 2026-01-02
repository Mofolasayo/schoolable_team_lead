'use client';

import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { rateTask, type PendingRating } from '@/lib/api/team-lead';
import { toast } from 'sonner';

interface TaskRatingModalProps {
    task: PendingRating;
    onClose: () => void;
    onRated: () => void;
}

export function TaskRatingModal({ task, onClose, onRated }: TaskRatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            await rateTask(task.id, { rating, comment: comment || undefined });
            toast.success('Task rated successfully!');
            onRated();
        } catch (error) {
            console.error('Error rating task:', error);
            toast.error('Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    const getRatingLabel = (r: number) => {
        switch (r) {
            case 1: return 'Poor';
            case 2: return 'Below Average';
            case 3: return 'Average';
            case 4: return 'Good';
            case 5: return 'Excellent';
            default: return 'Select a rating';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-500/20">
                            <Star className="h-5 w-5 text-amber-500" />
                        </div>
                        <h2 className="font-semibold">Rate Task Completion</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Task Info */}
                    <div className="mb-6">
                        <p className="text-sm text-muted-foreground">Task</p>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Completed by <span className="text-foreground">{task.assigneeName}</span>
                        </p>
                    </div>

                    {/* Star Rating */}
                    <div className="mb-6">
                        <p className="text-sm text-muted-foreground mb-3">How would you rate the work quality?</p>
                        <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <button
                                    key={r}
                                    onMouseEnter={() => setHoveredRating(r)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(r)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`h-10 w-10 transition-colors ${r <= (hoveredRating || rating)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-muted-foreground/30'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm mt-2 font-medium">
                            {getRatingLabel(hoveredRating || rating)}
                        </p>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label className="text-sm text-muted-foreground">
                            Additional feedback (optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="What did they do well? Any areas for improvement?"
                            rows={3}
                            className="w-full mt-2 px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                    >
                        Skip for now
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || submitting}
                        className="flex-1 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                <Star className="h-4 w-4" />
                                Submit Rating
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

interface TaskRatingPromptProps {
    pendingTasks: PendingRating[];
    onRated: () => void;
}

export function TaskRatingPrompt({ pendingTasks, onRated }: TaskRatingPromptProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    if (dismissed || pendingTasks.length === 0 || currentIndex >= pendingTasks.length) {
        return null;
    }

    const currentTask = pendingTasks[currentIndex];

    const handleRated = () => {
        if (currentIndex < pendingTasks.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setDismissed(true);
        }
        onRated();
    };

    const handleClose = () => {
        if (currentIndex < pendingTasks.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setDismissed(true);
        }
    };

    return (
        <TaskRatingModal
            task={currentTask!}
            onClose={handleClose}
            onRated={handleRated}
        />
    );
}
