import { useEffect, useRef, useState } from "react";
import { FaCopy, FaCheck, FaPencilAlt } from "react-icons/fa";
import { get_talent_tree, load_talent_tree } from "../store/talent_trees";
import { get_talent_string, get_wowhead_talent_url } from "./Talents/talent_string";
import { useAppDispatch, useAppSelector } from "../store/store_hooks";
import * as ui_store from "../store/ui";
import style from "./CopyNoteWindow.module.scss";


const NOTICE_MS = 5000  // keep in sync with the fade in CopyNoteWindow.module.scss


/** One line: the import string (click to copy) and an "edit" button opening it in the Wowhead calculator. */
export default function CopyTalentRow() {
    const [isCopied, setIsCopied] = useState(false);
    const [notice_key, set_notice_key] = useState(0);  // bumped per copy to restart the fading notice
    const notice_timer = useRef<number>(undefined);
    const dispatch = useAppDispatch();
    const player = useAppSelector(ui_store.get_copynote_player);
    const tree = useAppSelector(state => player ? get_talent_tree(state, player.spec_slug) : undefined);
    const has_talents = !!player?.talents && Object.keys(player.talents).length > 0;

    useEffect(() => {
        if (player && has_talents) { dispatch(load_talent_tree(player.spec_slug)); }
    }, [player?.spec_slug, has_talents]);

    const talent_string = tree && has_talents ? get_talent_string(tree, player!.talents!) : null;

    if (!talent_string) {
        let reason = "Loading talents...";
        if (!has_talents || tree === null) { reason = "No talent data for this fight"; }
        return <div className="text-muted">{reason}</div>;
    }

    async function doCopy(text: string) {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
        set_notice_key(key => key + 1);
        window.clearTimeout(notice_timer.current);
        notice_timer.current = window.setTimeout(() => set_notice_key(0), NOTICE_MS);
    }

    return (
        <div className={style.talent_row}>
            <button
                type="button"
                className={style.talent_string}
                onClick={() => doCopy(talent_string)}
                aria-label="copy talent import string"
                data-tooltip="click to copy"
                data-tooltip-size="small"
            >
                <span className={style.talent_string_text}>{talent_string}</span>
                <span className={style.talent_copy_icon}>{isCopied ? <FaCheck /> : <FaCopy />}</span>
                {notice_key > 0 && <span key={notice_key} className={style.talent_copied}>talents copied to clipboard.</span>}
            </button>
            <a
                className={["button border rounded", style.talent_edit].join(" ")}
                href={get_wowhead_talent_url(talent_string)}
                target="_blank"
                rel="noopener noreferrer"
            >
                <FaPencilAlt /> edit
            </a>
        </div>
    );
}
