export type Rating = "again" | "hard" | "good" | "easy";

export type LearningState = "new" | "learning" | "review" | "relearning";

export type CardSchedulingState = {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    lapses: number;
    learningState: LearningState;
    dueAt: string;
    lastReviewedAt: string | null;
};

const QUALITY: Record<Rating, number> = {
    again: 0,
    hard: 3,
    good: 4,
    easy: 5
};

const MIN_EASE = 1.3;
const DEFAULT_EASE = 2.5;

function round2(n: number) {
    return Math.round(n * 100) / 100;
}

function addDaysUtc(isoNow: string, days: number) {
    const d = new Date(isoNow);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
}

export function createNewCardState(now = new Date().toISOString()): CardSchedulingState {
    return {
        easeFactor: DEFAULT_EASE,
        intervalDays: 0,
        repetitions: 0,
        lapses: 0,
        learningState: "new",
        dueAt: now,
        lastReviewedAt: null
    };
}

export function scheduleCard(
    previous: CardSchedulingState,
    rating: Rating,
    now = new Date().toISOString()
): CardSchedulingState {
    const q = QUALITY[rating];
    let ease = previous.easeFactor || DEFAULT_EASE;
    let reps = previous.repetitions || 0;
    let interval = previous.intervalDays || 0;
    let lapses = previous.lapses || 0;
    let learningState: LearningState = previous.learningState || "new";

    const easeDelta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    ease = Math.max(MIN_EASE, ease + easeDelta);

    if (q < 3) {
        reps = 0;
        interval = 1;
        lapses += 1;
        learningState = "relearning";
    } else {
        if (reps === 0) {
            interval = 1;
        } else if (reps === 1) {
            interval = 6;
        } else {
            interval = Math.max(1, Math.round(interval * ease));
        }
        reps += 1;
        learningState = "review";
    }

    return {
        easeFactor: round2(ease),
        intervalDays: interval,
        repetitions: reps,
        lapses,
        learningState,
        dueAt: addDaysUtc(now, interval),
        lastReviewedAt: now
    };
}