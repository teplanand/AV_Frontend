export type BranchTimingType = {
    id: number;
    branch_id: number;
    timings: Record<string, Timing>
}

type Timing = {
    isClosed: boolean;
    day: TimeRange
    night: TimeRange
}

type TimeRange = {
    open?: string;
    close?: string;
}
