import { FaXmark } from "react-icons/fa6";
import { get_spell_display } from "../store/spells";
import { toMMSS } from "../utils";
import { useAppDispatch, useAppSelector } from "../store/store_hooks";
import { useEffect, useRef, useState, ChangeEvent } from 'react'
import * as ui_store from "../store/ui"
import style from "./CopyNoteWindow.module.scss";
import type Fight from "../types/fight";
import type Phase from "../types/phase";



/**
 * Finds the most recent phase in a fight that started before or at the given timestamp.
 *
 * @param fight - The fight object containing an array of phases.
 * @param timestamp - The timestamp to find the corresponding phase for.
 * @returns The latest phase that started before or at the given timestamp, or null if no phase exists.
 */
function get_phase_at_time(fight: Fight, timestamp: number): Phase | null {
    if (fight.phases.length === 0) return null;

    let result: Phase | null = null;

    for (const phase of fight.phases) {
        if (phase.ts <= timestamp) {
            result = phase; // Keep updating until we find the latest valid phase
        } else {
            break; // Stop once we pass the timestamp
        }
    }

    return result;
}


/**
 * Generates a formatted note string with player casts and timings.
 * 
 * @param name - The player's name to include in the note.
 * @param dynamic - Whether to use dynamic timers
 * @returns Formatted string with cast timings and spell information.
 */
function get_formatted_note(name: string, dynamic: boolean = false): string {

    // for the Note
    const player = useAppSelector(ui_store.get_copynote_player)
    const fight = useAppSelector(ui_store.get_copynote_fight)
    const spell_display = useAppSelector(get_spell_display)

    if (!player) { return "no player selected" }
    if (!fight) { return "no fight selected" }

    const rows: string[] = [];
    player.casts.forEach(cast => {

        if (!spell_display[cast.id]) {
            return;
        }

        const phase = dynamic && get_phase_at_time(fight, cast.ts)

        let ts = 0
        let trigger = ""

        if (phase) {
            ts = cast.ts - phase.ts
            trigger = phase.mrt ? ":" + phase.mrt : ""
        } else {
            ts = cast.ts
            trigger = ""
        }

        const ts_string = toMMSS(ts / 1000)
        rows.push(`{time:${ts_string}${trigger}} - ${name} {spell:${cast.id}}`)

    })
    const note = rows.join("\n")


    return note
}


export default function CopyNoteWindow() {

    // React
    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const [useDynamicTimer, setUseDynamicTimer] = useState(false);
    const textareaRef = useRef(null);

    // Redux
    const show_window = useAppSelector(ui_store.get_show_copynote)
    const fight = useAppSelector(ui_store.get_copynote_fight)
    const dispatch = useAppDispatch()


    const phasesAvailable = Boolean(fight?.phases.length)
    const note = get_formatted_note(name, phasesAvailable && useDynamicTimer)

    function closeWindow() {
        dispatch(ui_store.set_show_copynote(false));
    }

    async function textAreaClicked() {

        // copy to clipboard
        await navigator.clipboard.writeText(text);

        // update UI elements
        setIsCopied(true)

        // show
        setTimeout(() => {
            setIsCopied(false);
        }, 1500);
    }

    function nameInputChanged(event: ChangeEvent<HTMLInputElement>) {
        setName(event.target.value)
    }

    // Update the Text Area Content
    useEffect(() => {
        setText(note)
    }, [note])


    if (!show_window) {
        return null;
    }

    const dynTimerTooltip = phasesAvailable ?
        "Use Dynamic Timers relative to combat events." :
        "Dynamic Timers are not (yet) available for this Fight/Log."

    return (
        <div className={style.modal}>
            <div className="p-2 bg-dark rounded border">

                {/* Header */}
                <div className={`${style.header} mb-2`}>
                    <h3>Copy ERT Note (beta v2)</h3>
                    <FaXmark onClick={closeWindow}/>
                </div>

                {/* Settings */}
                <div className="d-grid grid-cols-2 mb-1">
                    <label>Player Name:</label>
                    <input onChange={nameInputChanged} value={name}></input>

                    <label className={phasesAvailable ? "" : "text-muted"}>use dynamic timer:</label>
                    <input
                        type="checkbox"
                        onChange={() => setUseDynamicTimer(!useDynamicTimer)}
                        checked={phasesAvailable && useDynamicTimer}
                        disabled={!phasesAvailable}
                        data-tooltip={dynTimerTooltip}
                        data-tooltip-size="small"
                    />
                </div>

                {/* Note */}
                <div className={style.textarea}>
                    <textarea
                        ref={textareaRef}
                        readOnly
                        className="border rounded"
                        onClick={textAreaClicked}
                        value={text}
                    />
                    {isCopied && <div className={style.notification}>note copied to clipboard.</div>}
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

        </div>
    )
}
