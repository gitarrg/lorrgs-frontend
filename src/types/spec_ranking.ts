
import type Report from "./report";

export default interface SpecRanking {
    spec_slug: string;
    boss_slug: string;
    difficulty: string;
    metric: string;

    reports?: Report[];
}

/** Metadata from GET /api/spec_ranking/{spec}/{boss}/info (reports stripped). */
export interface SpecRankingInfo {
    spec_slug: string;
    boss_slug: string;
    difficulty: string;
    metric: string;
    updated?: string;
    dirty?: boolean;
}
