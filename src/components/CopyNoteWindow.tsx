import { FaXmark } from "react-icons/fa6";
import { get_spell_display } from "../store/spells";
import { toMMSS } from "../utils";
import { useAppDispatch, useAppSelector } from "../store/store_hooks";
import { useRef, useState, ChangeEvent } from 'react'
import * as ui_store from "../store/ui"
import style from "./CopyNoteWindow.module.scss";
import type Fight from "../types/fight";
import type Phase from "../types/phase";
import useUser from "../routes/auth/useUser";



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
    const [isCopied, setIsCopied] = useState(false);
    const [useDynamicTimer, setUseDynamicTimer] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Redux
    const show_window = useAppSelector(ui_store.get_show_copynote)
    const fight = useAppSelector(ui_store.get_copynote_fight)
    const dispatch = useAppDispatch()
    const user = useUser()

    
    let permission_dyn_timer = user.permissions.includes("dynamic_timers")
    const phasesAvailable = Boolean(fight?.phases?.length)

    if (!phasesAvailable) {
        permission_dyn_timer = true;
    }
    if (!useDynamicTimer) {
        permission_dyn_timer = true;
    }

    

    let note = get_formatted_note(name, phasesAvailable && permission_dyn_timer && useDynamicTimer)

    if (!permission_dyn_timer) {
        note += "\n".repeat(10)
        note += `
    "Dear Visitor,"
    
    I'm sorry but dynamic Timers are not yet ready for free users.
    Please visit https://www.patreon.com/c/lorrgs or the discord server if you want to support the development.
    
    Thank you!"`
    }

    function closeWindow() {
        dispatch(ui_store.set_show_copynote(false));
    }

    async function textAreaClicked() {
        console.log("textAreaClicked")

        if (!permission_dyn_timer) { 
            // hehe cat
            await navigator.clipboard.writeText("https://www.patreon.com/c/lorrgs");
            return
        }

        // copy to clipboard
        await navigator.clipboard.writeText(note);

        // update UI elements
        setIsCopied(true)

        // show
        setTimeout(() => {
            setIsCopied(false);
        }, 1500);
    }

    const preventSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        if (useDynamicTimer && !permission_dyn_timer) {
            e.preventDefault();
        }
    };


    function nameInputChanged(event: ChangeEvent<HTMLInputElement>) {
        setName(event.target.value)
    }


    if (!show_window) {
        return null;
    }

    let dynTimerTooltip = "Use Dynamic Timers relative to combat events."
    if (!phasesAvailable) {
        dynTimerTooltip = "Dynamic Timers not available for this Fight."
    }

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
                    <input onChange={nameInputChanged} autoFocus value={name}></input>

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
                    <div className={`${style.textarea} ${!permission_dyn_timer ? `${style.textarea_disabled} no-select` : "" }`}>
                    <textarea
                        ref={textareaRef}
                        readOnly
                        className="border rounded"
                        onClick={textAreaClicked}
                        onFocus={() => {
                            if (permission_dyn_timer) {
                                textareaRef.current?.select();
                            }
                        }}
                        value={note}
                        onSelect={!permission_dyn_timer ? preventSelection : undefined}
                    >
                    </textarea>
                    {!permission_dyn_timer && useDynamicTimer && <div className={style.notification_patreon}>
                        Dynamic Timers only available for Legendary Patreon Members.<br></br>
                    </div>}
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
