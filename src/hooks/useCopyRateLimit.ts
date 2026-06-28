import { useState, useCallback } from "react";

const STORAGE_KEY = "copynote_timestamps";
const MAX_FREE_COPIES = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes


function getTimestamps(): number[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as number[];
    } catch {
        return [];
    }
}


function pruneOld(timestamps: number[]): number[] {
    const cutoff = Date.now() - WINDOW_MS;
    return timestamps.filter((ts) => ts > cutoff);
}


function persist(timestamps: number[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
}


/**
 * Tracks copy-note usage in localStorage.
 * Free users get MAX_FREE_COPIES per 15-minute rolling window.
 * After the limit, each additional copy requires a captcha (grants exactly 1 copy).
 */
export default function useCopyRateLimit() {
    const [, forceUpdate] = useState(0);
    const rerender = () => forceUpdate((n) => n + 1);

    const getRecentCount = useCallback(() => {
        return pruneOld(getTimestamps()).length;
    }, []);

    const remainingUses = MAX_FREE_COPIES - getRecentCount();
    const canCopy = remainingUses > 0;

    const recordCopy = useCallback(() => {
        const timestamps = pruneOld(getTimestamps());
        timestamps.push(Date.now());
        persist(timestamps);
        rerender();
    }, []);

    return { canCopy, remainingUses, maxUses: MAX_FREE_COPIES, recordCopy };
}
