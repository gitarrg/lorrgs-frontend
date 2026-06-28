import { useState, useCallback } from "react";

const STORAGE_KEY = "copynote_usage";
const MAX_FREE_COPIES = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes


interface UsageEntry {
    key: string;
    ts: number;
}

interface NextExpiry {
    key: string;
    expiresAtMs: number;
    remainingMs: number;
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


function save(entries: UsageEntry[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}


function load_and_prune(): UsageEntry[] {

    const entries_old = getEntries();
    const cutoff = Date.now() - WINDOW_MS;

    const entries_new = entries_old.filter((e) => e.ts > cutoff);

    if (entries_new.length !== entries_old.length) {
        save(entries_new);
    }

    return entries_new;
}

function get_next_expiry(entries: UsageEntry[]): NextExpiry | null {
    if (!entries.length) {
        return null;
    }

    const oldest_entry = entries.reduce((oldest, current) => {
        return current.ts < oldest.ts ? current : oldest;
    });

    const expires_at = oldest_entry.ts + WINDOW_MS;
    return {
        key: oldest_entry.key,
        expiresAtMs: expires_at,
        remainingMs: Math.max(0, expires_at - Date.now()),
    };
}


/**
 * Tracks copy-note usage in localStorage.
 * Free users get MAX_FREE_COPIES unique notes per 15-minute rolling window.
 * Copying the same note (same key) multiple times does not count extra.
 */
export default function useCopyRateLimit(noteKey: string) {

    const [, forceUpdate] = useState(0);
    const rerender = () => forceUpdate((n) => n + 1);

    const entries = load_and_prune();
    const count = entries.length;
    const alreadyRecorded = entries.some((e) => e.key === noteKey);;
    const remainingUses = MAX_FREE_COPIES - count;
    const canCopy = alreadyRecorded || remainingUses > 0;
    const nextExpiry = get_next_expiry(entries);


    const recordCopy = useCallback(() => {

        // dont record if already recorded
        if (alreadyRecorded) {
            return;
        }

        let entries = load_and_prune();
        entries.push({ key: noteKey, ts: Date.now() });
        save(entries);

        rerender();
    }, [noteKey, alreadyRecorded]);


    return {
        canCopy,
        remainingUses,
        alreadyRecorded,
        nextExpiringKey: nextExpiry?.key ?? null,
        nextExpiryAtMs: nextExpiry?.expiresAtMs ?? null,
        nextExpiryRemainingMs: nextExpiry?.remainingMs ?? null,
        maxUses: MAX_FREE_COPIES,
        recordCopy
    };
}
