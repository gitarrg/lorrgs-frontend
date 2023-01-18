import type Report from "./report";

export default interface CompRanking {
    boss_slug: string;
    reports?: Report[];
}