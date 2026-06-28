import { useState, useCallback } from "react";

const STORAGE_KEY = "copynote_usage";
const MAX_FREE_COPIES = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface UsageEntry {
    key: string;
    ts: number;
}

function getEntries(): UsageEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw) as UsageEntry[];
    } catch {
        return [];
    }
}

function pruneOld(entries: UsageEntry[]): UsageEntry[] {
    const cutoff = Date.now() - WINDOW_MS;
    return entries.filter((e) => e.ts > cutoff);
}

function persist(entries: UsageEntry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Tracks copy-note usage in localStorage.
 * Free users get MAX_FREE_COPIES unique notes per 15-minute rolling window.
 * Copying the same note (same key) multiple times does not count extra.
 */
export default function useCopyRateLimit(noteKey: string) {
    const [, forceUpdate] = useState(0);
    const rerender = () => forceUpdate((n) => n + 1);

    const getUniqueCount = useCallback(() => {
        return pruneOld(getEntries()).length;
    }, []);

    const isAlreadyRecorded = useCallback(() => {
        return pruneOld(getEntries()).some((e) => e.key === noteKey);
    }, [noteKey]);

    const uniqueCount = getUniqueCount();
    const alreadyRecorded = isAlreadyRecorded();
    const remainingUses = MAX_FREE_COPIES - uniqueCount;
    const canCopy = alreadyRecorded || remainingUses > 0;

    const recordCopy = useCallback(() => {
        const entries = pruneOld(getEntries());
        if (entries.some((e) => e.key === noteKey)) return;
        entries.push({ key: noteKey, ts: Date.now() });
        persist(entries);
        rerender();
    }, [noteKey]);

    return { canCopy, remainingUses, maxUses: MAX_FREE_COPIES, recordCopy };
}
