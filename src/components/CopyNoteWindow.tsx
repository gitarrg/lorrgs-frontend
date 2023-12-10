import { FaCopy, FaXmark } from "react-icons/fa6";
import style from "./CopyNoteWindow.scss";
import { MouseEvent, useEffect, useRef, useState, KeyboardEvent, ChangeEvent } from 'react'
import { useAppDispatch, useAppSelector } from "../store/store_hooks";
import * as ui_store from "../store/ui"
import Actor from "../types/actor";
import { toMMSS } from "../utils";
import { get_class_color } from "../store/classes";
import { get_spell_display } from "../store/spells";



function format_note(player: Actor, name: string, class_color: string): string {

    // {time:00:03}|cff808080On Pull|r - |cff00fe97Axeâs|r {spell:322118}  


}



function get_formatted_note(name: string) {

    // for the Note
    const player = useAppSelector(ui_store.get_copynote_player)
    let class_color = useAppSelector(state => get_class_color(state, player?.spec_slug || ""))
    const spell_display = useAppSelector(get_spell_display)
    
    if (!player) { return "no player selected" }
    
    
    class_color = class_color.replace("#", "")
    const colored_player_name = name ? `|cff${class_color}${name}|r` : ""
    
    
    const rows: string[] = [];
    player.casts.forEach(cast => {

        if (spell_display[cast.id]) {
            let ts = toMMSS(cast.ts / 1000)
            rows.push(`{time:${ts}} - ${colored_player_name} {spell:${cast.id}}`)
        }
    })
    const note = rows.join("\n")


    return note


}


export default function CopyNoteWindow() {

    const [name, setName] = useState("");
    const [text, setText] = useState("");
    const [isCopied, setIsCopied] = useState(false);
    const textareaRef = useRef(null);
    
    const show_window = useAppSelector(ui_store.get_show_copynote)
    const dispatch = useAppDispatch()


    const note = get_formatted_note(name)

    function closeWindow() {
        dispatch(ui_store.set_show_copynote(false));
    }

    async function textAreaClicked() {

        // copyt to clipboard
        await navigator.clipboard.writeText(text);

        // update UI elements
        setIsCopied(true)
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
    }, [name, note])




    if (!show_window) {
        return null;
    }


    return (
        <div className={style.modal}>
            <div className="p-2 bg-dark rounded border">


                <div className={style.header}>
                    <h3>Copy ERT Note (beta)</h3>
                    <FaXmark onClick={closeWindow}/>
                </div>


                <div>
                    <label>Player Name:</label>
                    <input onChange={nameInputChanged} value={name}></input>
                </div>

                <div className={style.textarea}>
                    <textarea
                        ref={textareaRef}
                        readOnly
                        className="border rounded"
                        onClick={textAreaClicked}
                        value={text}
                    />
                    {/* <FaCopy /> */}
                    {isCopied && <div className={style.notification}>note copied to clipboard.</div>}
                </div>


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
