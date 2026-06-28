import { FaCopy } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { get_boss } from "../store/bosses";
import { get_difficulty_name } from "../store/fights";
import { get_spec } from "../store/specs";
import { get_spell_display } from "../store/spells";
import { toMMSS } from "../utils";
import { useAppDispatch, useAppSelector } from "../store/store_hooks";
import { useEffect, useRef, useState, ChangeEvent } from 'react'
import * as ui_store from "../store/ui"
import SimpleCaptcha from "./shared/SimpleCaptcha";
import style from "./CopyNoteWindow.module.scss";
import type Actor from "../types/actor";
import type Boss from "../types/boss";
import type Fight from "../types/fight";
import type Phase from "../types/phase";
import useCopyRateLimit from "../hooks/useCopyRateLimit";
import useUser from "../routes/auth/useUser";


/** Output format for the copy-note modal. */
export enum NoteFormat {
    MRT = "MRT",
    NSRT = "NSRT",
}

export enum NameInputMode {
    PLAYER_NAME = "player_name",
    PLAYER_SPEC = "player_spec",
}

type SpellDisplayMap = Record<number, boolean | undefined>;


/**
 * Finds the most recent phase in a fight that started before or at the given timestamp.
 *
 * @param fight - The fight object containing an array of phases.
 * @param timestamp - The timestamp to find the corresponding phase for.
 * @returns The latest phase that started before or at the given timestamp, or null if no phase exists.
 */
function get_phase_at_time(fight: Fight, timestamp: number): Phase | null {
    const phases = fight.phases;
    if (!phases?.length) return null;

    let result: Phase | null = null;

    for (const phase of phases) {
        if (phase.ts <= timestamp) {
            result = phase; // Keep updating until we find the latest valid phase
        } else {
            break; // Stop once we pass the timestamp
        }
    }

    return result;
}

/**
 * One NSRT line: ordered `key:value` segments separated by `;`, trailing `;`.
 */
function format_nsrt_row(entries: readonly [string, string | number][]): string {
    return entries.map(([key, value]) => `${key}:${value}`).join(";") + ";";
}


/**
 * MRT-format ERT note lines.
 */
function get_note_mrt(
    name: string,
    player: Actor,
    fight: Fight,
    spell_display: SpellDisplayMap,
): string {

    const rows: string[] = [];

    player.casts.forEach((cast) => {

        if (!spell_display[cast.id]) {
            return;
        }

        let ts = cast.ts;
        let trigger = "";

        const phase = get_phase_at_time(fight, cast.ts);
        if (phase) {
            ts -= phase.ts;
            trigger = `,p${phase.id}`;
        }

        const ts_string = toMMSS(ts / 1000, 1);
        rows.push(`{time:${ts_string}${trigger}} - ${name} {spell:${cast.id}}`);
    });
    return rows.join("\n");
}

/**
 * "Northern Sky Raid Tools" style note.
 */
function get_note_nsrt(
    name: string,
    player: Actor,
    fight: Fight,
    boss: Boss,
    spell_display: SpellDisplayMap,
): string {

    const rows: string[] = [];

    const encounterId = boss.id;
    const encounterName = boss.full_name;

    rows.push(
        format_nsrt_row([
            ["EncounterID", encounterId],
            ["Difficulty", get_difficulty_name(fight.difficulty)],
            ["Name", encounterName],
        ]),
    );

    player.casts.forEach((cast) => {

        if (!spell_display[cast.id]) {
            return;
        }

        // key-value pairs for the row
        const pairs: [string, string | number][] = [];

        // let phase: Phase | null = null;
        const phase = get_phase_at_time(fight, cast.ts);

        // +2 because ph1 = from pull; ph2 = first real phase (phase.id = 0 -> 2)
        const phase_id = phase ? phase.id : 1;
        pairs.push(["ph", phase_id]);

        let ts = cast.ts;
        if (phase) {
            ts = cast.ts - phase.ts;
        }
        const seconds = (ts / 1000).toFixed(1);
        pairs.push(["time", seconds]);

        if (name) {
            pairs.push(["tag", name]);
        } else {
            // use tag based on spec id
            // TODO: ids need to be implemented on backend first
            // pairs.push(["tag", spec.id]);
        }

        pairs.push(["spellid", cast.id]);

        rows.push(format_nsrt_row(pairs));
    });

    return rows.join("\n");
}


/**
 * Get formatted note text based on current selection
 * 
 * @param name - The name of the player
 * @param dynamic - Whether to use dynamic timers
 * @param noteFormat - The format of the note
 * @returns The formatted note text
 */
function get_formatted_note(
    name: string,
    noteFormat: NoteFormat,
): string {

    const player = useAppSelector(ui_store.get_copynote_player);
    const spell_display = useAppSelector(get_spell_display) as SpellDisplayMap;
    const fight = useAppSelector(ui_store.get_copynote_fight);
    const boss = useAppSelector(state => get_boss(state, fight?.boss?.boss_slug));

    if (!player) {
        return "no player selected";
    }
    if (!fight) {
        return "no fight selected";
    }

    switch (noteFormat) {
        case NoteFormat.MRT:
            return get_note_mrt(name, player, fight, spell_display);
        case NoteFormat.NSRT:
            return get_note_nsrt(
                name,
                player,
                fight,
                boss,
                spell_display,
            );
    }
}


export default function CopyNoteWindow() {

    // React
    const [name, setName] = useState("");
    const [nameInputMode, setNameInputMode] = useState<NameInputMode>(NameInputMode.PLAYER_NAME);
    const lastManualNameRef = useRef("");
    const [isCopied, setIsCopied] = useState(false);
    const [noteFormat, setNoteFormat] = useState<NoteFormat>(NoteFormat.NSRT);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showCaptcha, setShowCaptcha] = useState(false); // show the captcha overlay
    const [nowMs, setNowMs] = useState(() => Date.now());

    // Redux
    const show_window = useAppSelector(ui_store.get_show_copynote)
    const fight = useAppSelector(ui_store.get_copynote_fight)
    const dispatch = useAppDispatch()
    const user = useUser()

    const player = useAppSelector(ui_store.get_copynote_player);
    const spec = useAppSelector(state => get_spec(state, player?.spec_slug));

    // Rate limiting
    const is_paid_user = user.permissions.includes("dynamic_timers");
    const is_free_user = !is_paid_user;
    const note_key = `${fight?.report_id}:${fight?.fight_id}:${player?.source_id}`;
    const { canCopy, remainingUses, alreadyRecorded, nextExpiryAtMs, maxUses, recordCopy } = useCopyRateLimit(note_key);
    const attempt_counter = Math.abs(Math.min(0, remainingUses)); // count overflow as attempts

    let remaining_uses_class = "";
    if (remainingUses <= 2) { remaining_uses_class = "text-danger" }
    else if (remainingUses <= 0) { remaining_uses_class = "text-warning" }
    else { remaining_uses_class = "text-success" }

    const nextExpiryRemainingMs = nextExpiryAtMs ? Math.max(0, nextExpiryAtMs - nowMs) : null;
    const next_expiry_remaining_time = nextExpiryRemainingMs !== null ? toMMSS(nextExpiryRemainingMs / 1000) : null;
    const next_expiry_remaining_tooltip = next_expiry_remaining_time ? `next charge available in ${next_expiry_remaining_time}.` : null;


    // Close window when Escape key is pressed
    useEffect(() => {
        if (!show_window) {
            return;
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                dispatch(ui_store.set_show_copynote(false));
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [show_window, dispatch]);

    // Update name
    useEffect(() => {
        if (nameInputMode !== "player_spec") {
            return;
        }

        if (noteFormat === NoteFormat.NSRT) {
            setName(`${spec.id}`);
        } else if (noteFormat === NoteFormat.MRT) {
            const class_name = spec.class.name.toUpperCase();
            setName(`spec:${class_name}:${spec?.index}`);
        }

    }, [nameInputMode, noteFormat, spec?.id]);

    useEffect(() => {
        const solved = is_paid_user || remainingUses > 0 || alreadyRecorded;
        setShowCaptcha(!solved);
    }, [note_key, is_paid_user, canCopy, remainingUses, alreadyRecorded]);

    useEffect(() => {
        if (!show_window) {
            return;
        }

        const interval = setInterval(() => {
            setNowMs(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [show_window]);


    // Generate Note
    let note = get_formatted_note(name, noteFormat);
    if (showCaptcha) {
        note = "You have reached the maximum number of copies for this note.\nPlease wait 15 minutes and try again.";
    }


    function closeWindow() {
        dispatch(ui_store.set_show_copynote(false));
    }

    async function doCopy() {
        await navigator.clipboard.writeText(note);
        setIsCopied(true);
        setTimeout(() => {
            setIsCopied(false);
        }, 1500);
    }

    async function textAreaClicked() {
        if (is_paid_user) {
            await doCopy();
            return;
        }

        if (is_free_user && canCopy) {
            recordCopy();
            await doCopy();
            return;
        }

        // Rate limited -- captcha overlay is already shown via `show_captcha`
    }

    async function onCaptchaVerify() {
        // record the solve
        // this should trigger the "showCaptcha" state to be false
        recordCopy();
    }

    function nameInputChanged(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value;
        lastManualNameRef.current = value;
        setName(value);
    }

    function nameInputModeChanged(event: ChangeEvent<HTMLSelectElement>) {
        const mode = event.target.value as NameInputMode;
        setNameInputMode(mode);
        if (mode === "player_name") {
            setName(lastManualNameRef.current);
        }
    }


    if (!show_window) {
        return null;
    }

    /*
        Main Render
    */
    return (
        <div className={style.modal}>
            <div className="p-2 bg-dark rounded border">

                {/* Header */}
                <div className={`${style.header} mb-2`}>
                    <h3><FaCopy /> Copy Note</h3>
                    <FaXmark onClick={closeWindow} />
                </div>

                {/* Settings */}
                <div className="d-grid grid-cols-2 mb-1">
                    <select
                        className={`${style.name_dropdown} mb-0`}
                        value={nameInputMode}
                        onChange={nameInputModeChanged}
                    >
                        <option value="player_name">Player Name</option>
                        <option value="player_spec">Player Spec</option>
                    </select>
                    <input
                        onChange={nameInputChanged}
                        disabled={nameInputMode === "player_spec"}
                        autoFocus={nameInputMode === "player_name"}
                        value={name}
                        placeholder="Name or Nickname"
                    ></input>

                    <label>Note Format:</label>
                    <div
                        className={style.noteFormatToggle}
                        role="group"
                        aria-label="Note format"
                    >
                        <button
                            type="button"
                            className={["button border rounded", style.noteFormatBtn].join(" ")}
                            data-note-format="mrt"
                            aria-pressed={noteFormat === NoteFormat.MRT}
                            aria-label="use Method Raid Tools Note format"
                            data-tooltip="use Method Raid Tools / Smart CD Reminder format"
                            data-tooltip-size="small"
                            onClick={() => setNoteFormat(NoteFormat.MRT)}
                        >
                            MRT
                        </button>
                        <button
                            type="button"
                            className={["button border rounded", style.noteFormatBtn].join(" ")}
                            data-note-format="nsrt"
                            aria-pressed={noteFormat === NoteFormat.NSRT}
                            aria-label="use Northern Sky Note Format"
                            data-tooltip="use Northern Sky Note Format"
                            data-tooltip-size="small"
                            onClick={() => setNoteFormat(NoteFormat.NSRT)}
                        >
                            NSRT
                        </button>
                    </div>
                </div>

                {/* Note */}
                <div className={style.textarea} data-blur={showCaptcha}>
                    <textarea
                        ref={textareaRef}
                        readOnly
                        className="border rounded"
                        onClick={textAreaClicked}
                        onFocus={() => textareaRef.current?.select()}

                        value={note}
                    >
                    </textarea>

                    {/* Captcha overlay */}
                    {showCaptcha &&
                        <div className={style.captcha_overlay}>
                            <div className={style.captcha_content}>

                                <SimpleCaptcha onVerify={onCaptchaVerify} attempt_counter={attempt_counter} />

                                <p className={style.upsell}>
                                    <a href="https://www.patreon.com/c/lorrgs" target="_blank" rel="noopener noreferrer">
                                        Legendary Patrons
                                    </a>
                                    <span className="text-muted">&nbsp;get unlimited copies.</span>
                                </p>
                            </div>
                        </div>
                    }

                    {isCopied && <div className={style.notification}>note copied to clipboard.</div>}
                </div>

                {/* Usage counter */}
                <div className={`${style.usage_counter} ${remaining_uses_class}`}>
                    {is_paid_user
                        ? <span className={style.unlimited_badge}>unlimited copies.</span>
                        : <span
                            data-tooltip={next_expiry_remaining_tooltip}
                        >{remainingUses}/{maxUses} instant copies per 15 minutes.</span>
                    }
                </div>

                {/* Info & Disclaimer */}
                <div className="p-2 wow-mage">
                    🛈 Show/hide Spells on the Timeline to include/exclude them in the Note
                </div>
                <div className="p-2 wow-rogue">
                    ⚠️ Blind Copy/Pasting Timings does not guarantee the same results.<br />
                    Make sure to adjust according to your guilds comp and killtime.
                </div>

            </div>
        </div >
    )
}
