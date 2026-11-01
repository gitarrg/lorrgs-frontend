
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


/** One row of GET /api/{game_version}/spec_ranking/status (what the Refresh Planner sees). */
export interface SpecRankingStatus {
    spec_slug: string;
    boss_slug: string;
    difficulty: string;
    metric: string;
    /** the metric the site shows for this spec (eg.: hps for healers) */
    is_default_metric: boolean;
    /** S3 LastModified. `null` if the ranking has no stored object yet. */
    last_refreshed: string | null;
    /** When the ranking was flagged dirty. `null` if it is not. */
    dirty_since: string | null;
}
